from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.family import Family
from src.models.family_member import FamilyMember
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.family import (
    FamilyCreate,
    FamilyDashboardMemberSpend,
    FamilyDashboardResponse,
    FamilyDashboardSummary,
    FamilyJoinRequest,
    FamilyMemberResponse,
    FamilyPrivacyUpdate,
    FamilyResponse,
    FamilySharedPlanRecommendation,
    FamilyStatusResponse,
)
from src.services.currency import convert


@dataclass(frozen=True)
class _MemberContext:
    family: Family
    member: FamilyMember


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _get_user_currency(user: User) -> str:
    return (user.preferred_currency or "USD").strip().upper()


async def _monthly_equivalent(
    session: AsyncSession,
    subscription: Subscription,
    *,
    target_currency: str,
) -> Decimal:
    amount = await convert(
        session,
        Decimal(subscription.amount),
        from_currency=subscription.currency,
        to_currency=target_currency,
    )
    cadence = subscription.cadence.lower()
    if cadence == "weekly":
        return _quantize_money((amount * Decimal(52)) / Decimal(12))
    if cadence == "quarterly":
        return _quantize_money(amount / Decimal(3))
    if cadence == "yearly":
        return _quantize_money(amount / Decimal(12))
    return _quantize_money(amount)


async def _get_membership(session: AsyncSession, user: User) -> _MemberContext | None:
    row = (
        await session.execute(
            select(Family, FamilyMember)
            .join(FamilyMember, FamilyMember.family_id == Family.id)
            .where(FamilyMember.user_id == user.id)
            .order_by(FamilyMember.id.asc())
        )
    ).first()
    if row is None:
        return None
    family, member = row
    return _MemberContext(family=family, member=member)


async def _require_membership(session: AsyncSession, user: User) -> _MemberContext:
    context = await _get_membership(session, user)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found.")
    return context


async def _ensure_no_existing_membership(session: AsyncSession, user: User) -> None:
    if await _get_membership(session, user) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Leave your current family before joining another.",
        )


async def _generate_invite_code(session: AsyncSession) -> str:
    for _ in range(5):
        invite_code = token_urlsafe(9).replace("-", "").replace("_", "")[:12].upper()
        existing = await session.scalar(select(Family.id).where(Family.invite_code == invite_code))
        if existing is None:
            return invite_code
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not create a family invite code.",
    )


def _serialize_member(
    member: FamilyMember,
    user: User,
    *,
    current_user_id: int,
) -> FamilyMemberResponse:
    return FamilyMemberResponse(
        id=member.id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=member.role,
        share_subscriptions=member.share_subscriptions,
        joined_at=member.created_at,
        is_current_user=user.id == current_user_id,
    )


async def _get_family_members(
    session: AsyncSession,
    family_id: int,
    *,
    current_user_id: int,
) -> list[FamilyMemberResponse]:
    rows = (
        await session.execute(
            select(FamilyMember, User)
            .join(User, User.id == FamilyMember.user_id)
            .where(FamilyMember.family_id == family_id)
            .order_by(
                FamilyMember.role.desc(),
                FamilyMember.created_at.asc(),
                FamilyMember.id.asc(),
            )
        )
    ).all()
    return [
        _serialize_member(member, member_user, current_user_id=current_user_id)
        for member, member_user in rows
    ]


async def get_family_status(session: AsyncSession, *, user: User) -> FamilyStatusResponse:
    context = await _get_membership(session, user)
    if context is None:
        return FamilyStatusResponse(family=None, members=[], current_member=None)

    members = await _get_family_members(session, context.family.id, current_user_id=user.id)
    current_member = next((member for member in members if member.is_current_user), None)
    return FamilyStatusResponse(
        family=FamilyResponse.model_validate(context.family),
        members=members,
        current_member=current_member,
    )


async def create_family(
    session: AsyncSession,
    *,
    user: User,
    payload: FamilyCreate,
) -> FamilyStatusResponse:
    await _ensure_no_existing_membership(session, user)
    family = Family(
        owner_user_id=user.id,
        name=payload.name,
        invite_code=await _generate_invite_code(session),
    )
    session.add(family)
    await session.flush()
    session.add(
        FamilyMember(
            family_id=family.id,
            user_id=user.id,
            role="owner",
            share_subscriptions=True,
        )
    )
    await session.commit()
    await session.refresh(family)
    return await get_family_status(session, user=user)


async def join_family(
    session: AsyncSession,
    *,
    user: User,
    payload: FamilyJoinRequest,
) -> FamilyStatusResponse:
    await _ensure_no_existing_membership(session, user)
    family = await session.scalar(select(Family).where(Family.invite_code == payload.invite_code))
    if family is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found.")

    session.add(
        FamilyMember(
            family_id=family.id,
            user_id=user.id,
            role="member",
            share_subscriptions=True,
        )
    )
    await session.commit()
    return await get_family_status(session, user=user)


async def update_family_privacy(
    session: AsyncSession,
    *,
    user: User,
    payload: FamilyPrivacyUpdate,
) -> FamilyStatusResponse:
    context = await _require_membership(session, user)
    context.member.share_subscriptions = payload.share_subscriptions
    await session.commit()
    return await get_family_status(session, user=user)


async def leave_family(session: AsyncSession, *, user: User) -> None:
    context = await _require_membership(session, user)
    family_id = context.family.id
    members = list(
        (
            await session.scalars(
                select(FamilyMember)
                .where(FamilyMember.family_id == family_id)
                .order_by(FamilyMember.created_at.asc(), FamilyMember.id.asc())
            )
        ).all()
    )
    remaining_members = [member for member in members if member.user_id != user.id]

    await session.delete(context.member)
    if not remaining_members:
        await session.delete(context.family)
    elif context.member.role == "owner":
        next_owner = remaining_members[0]
        next_owner.role = "owner"
        context.family.owner_user_id = next_owner.user_id

    await session.commit()


async def get_family_dashboard(session: AsyncSession, *, user: User) -> FamilyDashboardResponse:
    context = await _require_membership(session, user)
    target_currency = _get_user_currency(user)
    member_rows = (
        await session.execute(
            select(FamilyMember, User)
            .join(User, User.id == FamilyMember.user_id)
            .where(FamilyMember.family_id == context.family.id)
            .order_by(
                FamilyMember.role.desc(),
                FamilyMember.created_at.asc(),
                FamilyMember.id.asc(),
            )
        )
    ).all()

    visible_user_ids = [
        member_user.id
        for member, member_user in member_rows
        if member.share_subscriptions or member_user.id == user.id
    ]
    subscriptions = (
        list(
            (
                await session.scalars(
                    select(Subscription)
                    .where(
                        Subscription.user_id.in_(visible_user_ids),
                        Subscription.status == "active",
                    )
                    .order_by(
                        Subscription.user_id.asc(),
                        Subscription.vendor.asc(),
                        Subscription.id.asc(),
                    )
                )
            ).all()
        )
        if visible_user_ids
        else []
    )

    monthly_by_subscription: dict[int, Decimal] = {}
    for subscription in subscriptions:
        monthly_by_subscription[subscription.id] = await _monthly_equivalent(
            session,
            subscription,
            target_currency=target_currency,
        )

    subscriptions_by_user: dict[int, list[Subscription]] = {}
    for subscription in subscriptions:
        subscriptions_by_user.setdefault(subscription.user_id, []).append(subscription)

    member_spend: list[FamilyDashboardMemberSpend] = []
    for member, member_user in member_rows:
        visible = member.share_subscriptions or member_user.id == user.id
        member_subscriptions = subscriptions_by_user.get(member_user.id, []) if visible else []
        member_spend.append(
            FamilyDashboardMemberSpend(
                user_id=member_user.id,
                full_name=member_user.full_name,
                visible=visible,
                active_subscriptions=len(member_subscriptions),
                monthly_spend=_quantize_money(
                    sum(
                        (
                            monthly_by_subscription[subscription.id]
                            for subscription in member_subscriptions
                        ),
                        Decimal("0.00"),
                    )
                ),
                currency=target_currency,
            )
        )

    names_by_user = {member_user.id: member_user.full_name for _member, member_user in member_rows}
    grouped_by_vendor: dict[str, list[Subscription]] = {}
    for subscription in subscriptions:
        grouped_by_vendor.setdefault(subscription.vendor.strip().lower(), []).append(subscription)

    recommendations: list[FamilySharedPlanRecommendation] = []
    for vendor_key, vendor_subscriptions in grouped_by_vendor.items():
        user_ids = {subscription.user_id for subscription in vendor_subscriptions}
        if len(user_ids) < 2:
            continue
        sorted_subscriptions = sorted(
            vendor_subscriptions,
            key=lambda subscription: monthly_by_subscription[subscription.id],
            reverse=True,
        )
        estimated_savings = _quantize_money(
            sum(
                (
                    monthly_by_subscription[subscription.id]
                    for subscription in sorted_subscriptions[1:]
                ),
                Decimal("0.00"),
            )
        )
        recommendations.append(
            FamilySharedPlanRecommendation(
                vendor=sorted_subscriptions[0].vendor or vendor_key.title(),
                subscription_count=len(vendor_subscriptions),
                member_names=sorted({names_by_user[user_id] for user_id in user_ids}),
                estimated_monthly_savings=estimated_savings,
                currency=target_currency,
                reason="Multiple family members have active plans from the same vendor.",
            )
        )

    recommendations.sort(
        key=lambda item: (item.estimated_monthly_savings, item.subscription_count),
        reverse=True,
    )
    visible_total = _quantize_money(sum(monthly_by_subscription.values(), Decimal("0.00")))
    return FamilyDashboardResponse(
        summary=FamilyDashboardSummary(
            family_name=context.family.name,
            member_count=len(member_rows),
            sharing_member_count=sum(
                1 for member, _user in member_rows if member.share_subscriptions
            ),
            visible_active_subscriptions=len(subscriptions),
            visible_monthly_spend=visible_total,
            currency=target_currency,
        ),
        member_spend=member_spend,
        recommendations=recommendations[:5],
    )
