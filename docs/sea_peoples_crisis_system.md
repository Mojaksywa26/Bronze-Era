# The Sea Peoples Crisis

This module is a country-scoped dynamic disaster for the Bronze Era total conversion.

## Design

- Phase 1: climate pressure and famine.
- Phase 2: migration pressure and coastal raiding.
- Phase 3: trade crash, palace economy collapse, and internal breakdown.
- Phase 4: settlement pressure and political fragmentation.
- Phase 5: assimilation, Phoenician recovery, and Iron Age transition.

## Scope

The crisis targets countries tied to the eastern Mediterranean world: Greece, Cyprus, Anatolia, the Levant, coastal Egypt, Sicily, southern Italy, and related maritime cultures.

## Implementation

- Events live in `in_game/events/bronze_sea_peoples_crisis_events.txt`.
- Country variables are managed in `in_game/common/scripted_effects/00_bronze_sea_peoples_crisis_effects.txt`.
- Region/culture eligibility lives in `in_game/common/scripted_triggers/00_bronze_sea_peoples_crisis_triggers.txt`.
- Effects are applied through auto modifiers in `in_game/common/auto_modifiers/00_bronze_sea_peoples_crisis_modifiers.txt`.
- Yearly pulse hooks live in `in_game/common/on_action/00_bronze_sea_peoples_crisis_on_action.txt`.
- The vanilla `yearly_country_pulse` is preserved locally in `in_game/common/on_action/country_yearly.txt` and calls `sea_peoples_crisis_yearly_pulse`.
- Player countermeasures live in `in_game/common/generic_actions/00_bronze_sea_peoples_crisis_actions.txt`.
- Crisis action prices live in `in_game/common/prices/00_bronze_sea_peoples_crisis_prices.txt`.

The Sea Peoples are intentionally not a normal permanent country. The system treats them as raiders, refugees, mercenaries, migrants, and temporary settlement pressure.

## Player Countermeasures

The countermeasures are intentionally painful. They reduce one part of the crisis while creating pressure elsewhere:

- Fortify Coastal Palaces: defense and naval safety, paid with grain, labor, and urban development.
- Open Emergency Granaries: famine relief, paid with stability, government power, and elite anger.
- Escort Bronze Convoys: trade protection, paid with sailors, gold, and war exhaustion.
- Raise Palace Levies: defense, paid with manpower, production, and worse harvest pressure.
- Hire Migrant War Bands: immediate military relief, paid with settlement pressure and unrest risk.
- Controlled Settlement: long-term assimilation, paid with food, control, and elite anger.
- Appease the Sanctuaries: unrest relief, paid with religious influence, grain, and production.
- Call the League Levy: Mycenaean defense, paid with Achaean Unity.
- Mobilize the Delta Defense: strong Egyptian response, paid with grain, manpower, authority, and exhaustion.
- Open the Phoenician Harbours: Levantine recovery, paid with cultural mixing and control loss.
