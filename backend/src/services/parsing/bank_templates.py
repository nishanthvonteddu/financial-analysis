from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BankTemplate:
    slug: str
    display_name: str
    header_sets: tuple[frozenset[str], ...]
    header_keywords: tuple[str, ...] = ()
    text_markers: tuple[str, ...] = ()


BANK_TEMPLATES = (
    BankTemplate(
        slug="chase",
        display_name="Chase",
        header_sets=(
            frozenset({"posting date", "details", "amount"}),
            frozenset({"transaction date", "description", "amount"}),
        ),
        header_keywords=("posting date", "details", "transaction date", "amount"),
        text_markers=("chase", "jpmorgan"),
    ),
    BankTemplate(
        slug="bank_of_america",
        display_name="Bank of America",
        header_sets=(
            frozenset({"date", "original description", "amount"}),
            frozenset({"date", "simple description", "amount"}),
        ),
        header_keywords=("original description", "simple description", "account number"),
        text_markers=("bank of america", "bofa", "bankofamerica"),
    ),
    BankTemplate(
        slug="wells_fargo",
        display_name="Wells Fargo",
        header_sets=(frozenset({"date", "amount", "memo"}),),
        header_keywords=("memo", "check number", "type"),
        text_markers=("wells fargo", "wellsfargo"),
    ),
    BankTemplate(
        slug="capital_one",
        display_name="Capital One",
        header_sets=(
            frozenset({"transaction date", "description", "amount"}),
            frozenset({"transaction date", "posted date", "description"}),
        ),
        header_keywords=("transaction date", "posted date", "card no."),
        text_markers=("capital one", "capitalone"),
    ),
    BankTemplate(
        slug="amex",
        display_name="American Express",
        header_sets=(frozenset({"date", "appears on your statement as", "amount"}),),
        header_keywords=("appears on your statement as", "extended details"),
        text_markers=("american express", "amex"),
    ),
    BankTemplate(
        slug="citi",
        display_name="Citi",
        header_sets=(
            frozenset({"date", "description", "status"}),
            frozenset({"status", "debit", "credit"}),
        ),
        header_keywords=("status",),
        text_markers=("citibank", "citi card", "citi"),
    ),
)

NON_GENERIC_TEMPLATES = tuple(BANK_TEMPLATES)
