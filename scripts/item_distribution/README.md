Our community recently hosted a mod spotlight event where we crafted sets of items to distribute during demonstrations. However, we quickly realized that writing KubeJS code for this task was quite challenging due to the sparse documentation for version 1.21.

To address this, I've developed a script that simplifies the process of creating and distributing item sets. ItemSetDistributor.js is designed to:

- **Easily Define Item Sets:** You can define sets of items with their respective quantities and command names right at the top of the script.
- **Control Command Usage:** Set whether a command can only be used once by non-op players, perfect for managing starter kits or event rewards.
- **Flexible for Ops:** Operators can give items to other players or reset command usage, allowing for dynamic control during events.

This script could be particularly useful for:

- **Starter Kits:** Provide new players with a set of items to kickstart their adventure.
- **Event Rewards:** Distribute special item sets during community events or challenges.