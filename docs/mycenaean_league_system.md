# Mycenaean League System

This file documents the Bronze Age imperial system implemented for the Achaean palace kingdoms.

## Core Identity

Primary name: Mycenaean League

Usable flavor names:
- League of the Achaeans
- Achaean League
- Kingdoms of the Achaeans
- Great Wanaxate
- Achaean Hegemony

Leader title:
- High Wanax
- Great Wanax
- King of Kings of the Achaeans

Member ruler title:
- Wanax

High noble and army title:
- Lawagetas

## Start Members

The league starts with:
- 0001G, representing Mycenaea
- ACHAE
- ATHEN
- IOLC
- ORCHO
- PYLOS
- RHODE
- SPART
- THEBE

0001G begins as High Wanax.

## Authority

The authority variable is `mycenaean_league_authority`, localized as Achaean Unity.

It represents:
- shared palace diplomacy
- religious legitimacy
- military cohesion
- prestige of the High Wanax
- willingness of members to answer pan-Achaean calls

Monthly growth is driven by internal peace and the size of the palace network. It falls when the league lacks a High Wanax, when members fight each other, or when the member network fragments.

Script hooks:
- `change_mycenaean_league_authority = { value = X }`
- `subtract_mycenaean_league_authority = { value = X }`
- `current_mycenaean_league_authority = { value = X }`

These are intended for later events: Sea Peoples, famine, earthquake chains, trade collapse, palace destruction, and successful expeditions.

## Election Logic

The High Wanax is selected by score every 24 months.

The score rewards:
- great power score
- palace wealth
- great palace status
- secondary palace status
- sanctuary patronage
- maritime wealth for Rhodes
- recent councils in the megaron
- shared sacrifices
- Linear B administration
- pan-Achaean expeditions
- rival wanax claimants

Forced tribute can strengthen the High Wanax materially, but it hurts legitimacy in future leader scoring.

Primary candidates:
- 0001G
- PYLOS
- SPARTA
- THEBES

Secondary candidates:
- ATHENS
- IOLCUS
- ORCHOMENUS

Rhodes is penalized by island distance but can overcome it through wealth.

## Military Logic

Members may fight each other, which damages Achaean Unity over time.

Defensive calls:
- automatic when authority is strong
- optional when authority is weak
- not reliable during collapse

Offensive calls:
- reserved for the High Wanax
- require high Achaean Unity
- represent pan-Achaean expeditions

## Tribute

The tribute payment is `mycenaean_palace_tribute`.

Non-leader members pay the High Wanax. This represents bronze, grain, textiles, palace labor, and levies. The current starting law uses regular bronze tribute.

## Reforms And Laws

Implemented laws:
- Wanaxate Hegemony
- Palace Tribute
- Sanctuary Legitimacy
- War Council

Starting policies:
- Recognized High Wanax
- Bronze Tribute
- Shared Festivals
- Palace Oaths

More centralized possible policy path:
- Great Wanaxate
- Palace Levies
- Divine Omens
- Pan-Achaean Campaign

More decentralized possible policy path:
- Equal Palaces
- Gift Exchange
- Local Sanctuaries
- Local War Bands

## Possible Decisions And Actions

Implemented generic actions:
- Call Council in the Megaron: leader action, raises authority, costs gold, prestige, government power, and noble satisfaction
- Sponsor Shared Sacrifice: member action, converts religious influence and wealth into authority at a stability cost
- Send Linear B Administrators: leader action, improves control and production while angering rural households
- Mediate Palace Rivalry: leader action, raises authority through costly arbitration
- Demand Bronze Tribute: leader action, improves extraction but lowers authority and satisfaction
- Summon Palace Levies: leader action, creates temporary military strength while draining farms and unity
- Proclaim Pan-Achaean Expedition: leader action at high authority, strong military/naval boost with severe costs
- Fortify the Megara: member action, improves survival but turns the palace inward and lowers unity

## Collapse Model

The league can collapse completely when Achaean Unity falls to zero, or when too few members remain.

Members automatically leave during severe collapse:
- if they enter civil war
- if Achaean Unity falls to 5 or lower

Implemented event hooks:
- yearly palace politics pulse
- council and sanctuary events
- tribute disputes
- lawagetas campaign pressure
- rival High Wanax claims
- shared Achaean festivals
- Linear B archive pressure
- earthquake and palace failure events
- island sea road events
- war glory events
- low-authority archive breakdown
- burning-palace collapse pressure

The Sea Peoples crisis also damages Mycenaean authority through its own event chain and emergency league levy action.

## UI Theme

Recommended visual language:
- bronze and dark red accents
- Linear B flavor in icons or event art
- megaron halls
- chariots
- palace archives
- amphorae and bronze ingots
- sanctuary fires and omens

Avoid:
- medieval crowns
- imperial eagles
- papal or church framing
- feudal estates language
- crusade or reformation vocabulary
