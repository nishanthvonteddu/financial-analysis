import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FamilyWorkspace } from "@/components/family/family-workspace";
import {
  useCreateFamily,
  useFamilyDashboard,
  useFamilyStatus,
  useJoinFamily,
  useLeaveFamily,
  useUpdateFamilyPrivacy,
} from "@/hooks/use-family";

vi.mock("@/hooks/use-family", () => ({
  useCreateFamily: vi.fn(),
  useFamilyDashboard: vi.fn(),
  useFamilyStatus: vi.fn(),
  useJoinFamily: vi.fn(),
  useLeaveFamily: vi.fn(),
  useUpdateFamilyPrivacy: vi.fn(),
}));

const baseMutation = {
  error: null,
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
};

function mockMutations() {
  vi.mocked(useCreateFamily).mockReturnValue(
    baseMutation as unknown as ReturnType<typeof useCreateFamily>,
  );
  vi.mocked(useJoinFamily).mockReturnValue(
    baseMutation as unknown as ReturnType<typeof useJoinFamily>,
  );
  vi.mocked(useLeaveFamily).mockReturnValue(
    baseMutation as unknown as ReturnType<typeof useLeaveFamily>,
  );
  vi.mocked(useUpdateFamilyPrivacy).mockReturnValue(
    baseMutation as unknown as ReturnType<typeof useUpdateFamilyPrivacy>,
  );
}

describe("FamilyWorkspace", () => {
  it("renders create and join controls when the user has no family", () => {
    mockMutations();
    vi.mocked(useFamilyStatus).mockReturnValue({
      data: { current_member: null, family: null, members: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useFamilyStatus>);
    vi.mocked(useFamilyDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useFamilyDashboard>);

    render(<FamilyWorkspace />);

    expect(screen.getByRole("heading", { name: "New household" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Existing household" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create family/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Join family/ })).toBeDisabled();
  });

  it("renders members, privacy, and shared plan recommendations", () => {
    mockMutations();
    vi.mocked(useFamilyStatus).mockReturnValue({
      data: {
        current_member: {
          email: "owner@example.com",
          full_name: "Owner One",
          id: 1,
          is_current_user: true,
          joined_at: "2026-04-24T00:00:00Z",
          role: "owner",
          share_subscriptions: true,
          user_id: 1,
        },
        family: {
          created_at: "2026-04-24T00:00:00Z",
          id: 1,
          invite_code: "FAMILY123",
          name: "Household",
          owner_user_id: 1,
          updated_at: "2026-04-24T00:00:00Z",
        },
        members: [
          {
            email: "owner@example.com",
            full_name: "Owner One",
            id: 1,
            is_current_user: true,
            joined_at: "2026-04-24T00:00:00Z",
            role: "owner",
            share_subscriptions: true,
            user_id: 1,
          },
          {
            email: "member@example.com",
            full_name: "Member Two",
            id: 2,
            is_current_user: false,
            joined_at: "2026-04-24T00:00:00Z",
            role: "member",
            share_subscriptions: false,
            user_id: 2,
          },
        ],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useFamilyStatus>);
    vi.mocked(useFamilyDashboard).mockReturnValue({
      data: {
        member_spend: [
          {
            active_subscriptions: 2,
            currency: "USD",
            full_name: "Owner One",
            monthly_spend: "30.00",
            user_id: 1,
            visible: true,
          },
          {
            active_subscriptions: 0,
            currency: "USD",
            full_name: "Member Two",
            monthly_spend: "0.00",
            user_id: 2,
            visible: false,
          },
        ],
        recommendations: [
          {
            currency: "USD",
            estimated_monthly_savings: "12.00",
            member_names: ["Owner One", "Member Two"],
            reason: "Multiple family members have active plans from the same vendor.",
            subscription_count: 2,
            vendor: "Netflix",
          },
        ],
        summary: {
          currency: "USD",
          family_name: "Household",
          member_count: 2,
          sharing_member_count: 1,
          visible_active_subscriptions: 2,
          visible_monthly_spend: "30.00",
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useFamilyDashboard>);

    render(<FamilyWorkspace />);

    expect(screen.getByRole("heading", { name: "Household roster" })).toBeInTheDocument();
    expect(screen.getAllByText("Owner One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Member Two").length).toBeGreaterThan(0);
    expect(screen.getByRole("checkbox", { name: /Share subscriptions/ })).toBeChecked();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("2 visible plans")).toBeInTheDocument();
    expect(screen.getAllByText("Private")).toHaveLength(2);
  });
});
