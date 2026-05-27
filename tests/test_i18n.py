"""Verifies that the compiled .mo catalogues load and translate.

`gettext.translation(..., fallback=True)` silently falls back to identity
if a .mo file is missing — masking the bug that the Portuguese reports
were being generated in English.  These tests assert that the PT catalogue
is actually being consulted (PT strings differ from their EN keys), and
that the EN catalogue at minimum loads without error.
"""

from pump.utilities.report import LocalizationHelper


def test_en_translation_loads():
    helper = LocalizationHelper(language="en")
    # In EN, msgid == msgstr (or untranslated falls back to msgid).
    assert helper._("Equipment Description") == "Equipment Description"


def test_pt_translation_translates_known_string():
    helper = LocalizationHelper(language="pt")

    # Sample strings drawn from the PT .po file.
    assert helper._("Equipment Description") == "Descrição do Equipamento"
    assert helper._("Manufacturer") == "Fabricante"
    assert helper._("Efficiency") == "Eficiência"
    assert helper._("Report") == "Relatório"


def test_pt_translation_differs_from_english_input():
    """Smoke check: if the PT .mo file is missing or empty, gettext silently
    returns the msgid unchanged. Catch that by asserting at least one
    known string changes between EN and PT."""
    en = LocalizationHelper(language="en")
    pt = LocalizationHelper(language="pt")
    assert en._("Manufacturer") != pt._("Manufacturer")
