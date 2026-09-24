---
title: "Course patterns — course plan"
date: 2026-09-23
status: agreed
---

# Course plan

## Recurring visuals → components
| Visual | Component | Attributes it needs |
|---|---|---|
| a pipeline of stages | `cs-chain` (kit) | items, cols, lit |
| a set of labelled parts in order | `cs-keys` (kit) | keys, cols, order |
| a subject control, marked as an example | `demo-dial` (figures.js) | value, max, lit, example |

## Lesson 1 — Figures that move
- **Idea:** a figure moves only when the idea has an order; then it holds still and each step changes one thing, which the step names.
- **Walkthrough #pipeline** (cs-chain, 6 steps): beat k lights stage k. Beat 0 = rest (nothing lit).
- **Walkthrough #switch** (hand-drawn SVG, 3 steps):
  ```
  beat | step headline           | what changes
    0  | (before step 1)         | the phone and the rail only
    1  | The figure pins         | pinned figure box and its label in
    2  | A switch line sits under| dashed line and its label in
    3  | A step crosses it       | step card moves above the line; figure box lit; "changed by step 1" in
  ```
- **Compare #modes**: step / flat, with a flow in the step state.
- **Exercises:** Draft 10 min "Write a beat table" (every beat changes one thing, named by label); Try 5 min "Read it two ways".
- **Encore:** "Motion or not", `.dare` of ten teaching moves, three rounds.
- **Checkpoint:** tell order from a list; write a beat table; know what flat mode shows.

## Lesson 2 — Rooms and encores
- **Idea:** every exercise lives in a room and ends on something you can point at; the lesson ends with a game.
- **Figures:** a chain of what an exercise carries; `cs-keys` with order; an encore table.
- **Exercises:** Draft 10 min "Write the success first".
- **Encore:** "Two-minute lesson", `.timer` 120 s × 3.
- **Checkpoint:** success first; flags stay; end on something played.
