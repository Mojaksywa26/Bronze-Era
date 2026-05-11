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
- ACHAEA
- ATHENS
- IOLCUS
- ORCHOMENUS
- PYLOS
- RHODES
- SPARTA
- THEBES

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

Recommended later generic actions:
- Call Council in the Megaron: leader action, small authority gain, prestige cost if overused
- Sponsor Shared Sacrifice: member or leader action, religious influence into authority
- Demand Bronze Tribute: leader action, authority cost if members dislike the High Wanax
- Summon Palace Levies: leader action, temporary manpower or army support, authority cost
- Proclaim Pan-Achaean Expedition: leader action, offensive call enabled only at high authority
- Mediate Palace Rivalry: leader action, prestige or gold cost to stop member conflicts
- Fortify the Megara: member action during collapse, improves survival but lowers unity
- Send Linear B Administrators: leader action, improves tribute and control in loyal members

## Collapse Model

The league can collapse completely when Achaean Unity falls to zero, or when too few members remain.

Members automatically leave during severe collapse:
- if they enter civil war
- if Achaean Unity falls to 5 or lower

Recommended future event hooks:
- Sea Peoples raids: subtract 10 to 25 authority
- earthquake sequence: subtract 5 to 20 authority and damage palace locations
- famine: subtract 5 to 15 authority and lower prosperity
- trade collapse: subtract 10 authority and reduce maritime/trade modifiers
- palace destruction: subtract 15 authority and remove sanctuary or palace statuses
- successful expedition: add 10 to 20 authority
- shared festival: add 3 to 8 authority

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
