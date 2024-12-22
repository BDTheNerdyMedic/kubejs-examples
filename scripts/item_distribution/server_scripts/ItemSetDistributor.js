/**
 * Command Usages for Item Distribution:
 * 
 * - **Self Use (No Arguments)**:
 *   - Usage: `/giveItemSet1`
 *   - Description: Allows any player to execute the command to receive items for themselves. 
 *     If the command is set to one-use (`oneUse: true`), non-op players can only use it once.
 *
 * - **Target Another Player (Player Argument)**:
 *   - Usage: `/giveItemSet1 playerName`
 *   - Description: Ops can target another player to give them the items from the set. 
 *     For one-use commands, the command's status is marked as used for the targeted player.
 *
 * - **Clear Command Status (With 'clear' Argument)**:
 *   - Usage: `/giveItemSet2 playerName clear`
 *   - Description: Ops can reset the usage status of a one-use command for a specific player, 
 *     allowing them to receive the items again. This command sends feedback to both the 
 *     command executor and the player whose status is cleared.
 * 
 * Note:
 * - Only ops can use commands with a player argument or the 'clear' option.
 * - If a player tries to use a one-use command after it has been executed, they will 
 *   receive a message indicating they've already received those items.
 *
 * -------------------------------------------------------------------------------------------
 * 
 * Define item sets for command registration:
 * Each item set is an array of objects where:
 * - 'command': The name of the command (e.g., /giveItemSet1)
 * - 'oneUse': Boolean indicating if the command can only be run once by non-op players
 *            (default is false for unlimited use)
 * - 'id': The item identifier (e.g., 'minecraft:diamond')
 * - 'count': The number of items to give; optional, defaults to 1 if not specified
 *
 * Example format:
 * [
 *   { command: "commandName", oneUse: boolean },
 *   { id: "itemId", count: number },
 *   ...
 * ]
 *
 * Note:
 * - The first object in the array must contain 'command' and can optionally include 'oneUse'
 * - Subsequent objects define the items to be given, specifying 'id' and 'count'
*/

const itemSet1 = [
    { command: "giveItemSet1" },
    { id: "minecraft:stone_sword" },
    { id: "minecraft:stone_pickaxe" },
    { id: "minecraft:stone_axe" },
    { id: "minecraft:stone_shovel" }
];
registerItemCommand(itemSet1);

const itemSet2 = [
    { command: "giveItemSet2", oneUse: true },
    { id: "minecraft:iron_ingot", count: 32 },
    { id: "minecraft:gold_ingot", count: 16 },
    { id: "minecraft:diamond", count: 8 }
];
registerItemCommand(itemSet2);

// Global subcategory for command tracking
const commandSubcategory = 'itemCommands';

function registerItemCommand(items) {
    ServerEvents.commandRegistry(event => {
        if (!items || !items.length || !items[0].command) return;

        const Commands = event.commands;
        const Arguments = event.arguments;
        const command = items[0].command;
        const oneUse = items[0].oneUse || false;

        event.register(
            Commands.literal(command)
                // No permission check for self-use with check for non-ops
                .executes(ctx => {
                    const player = ctx.source.player;
                    if (ctx.source.hasPermission(2) || manageCommandState(player, command, 'canRun', oneUse)) {
                        giveItems(player, items);
                        if (oneUse && !ctx.source.hasPermission(2)) manageCommandState(player, command, 'markRun');
                        return 1;
                    }
                    ctx.source.sendFailure(Component.red(`You've already received items from '${command}'.`));
                    return 0;
                })
                // Permission check for targeting another player
                .then(
                    Commands.argument('player', Arguments.PLAYER.create(event))
                        .requires(source => source.hasPermission(2))
                        .executes(ctx => {
                            let targetPlayer;
                            try {
                                targetPlayer = Arguments.PLAYER.getResult(ctx, 'player');
                                if (!manageCommandState(targetPlayer, command, 'canRun', oneUse)) {
                                    ctx.source.sendFailure(Component.red(`The player has already received items from '${command}'.`));
                                    return 0;
                                }
                                giveItems(targetPlayer, items);
                                if (oneUse) manageCommandState(targetPlayer, command, 'markRun');
                                return 1;
                            } catch (error) {
                                if (error.message.includes("No player was found")) {
                                    ctx.source.sendFailure(Component.red("Player not found!"));
                                } else {
                                    console.error(`Unexpected error: ${error.message}`);
                                    ctx.source.sendFailure(Component.red("An unexpected error occurred."));
                                }
                                return 0;
                            }
                        })
                        .then(
                            Commands.literal('clear')
                                .executes(ctx => {
                                    let targetPlayer;
                                    try {
                                        targetPlayer = Arguments.PLAYER.getResult(ctx, 'player');
                                        manageCommandState(targetPlayer, command, 'clearRun');
                                        ctx.source.sendSystemMessage(Text.green(`Command '${command}' cleared for ${targetPlayer.getName().getString()}.`));
                                        targetPlayer.server.tell(Text.of(`Command '${command}' has been cleared by an operator.`));
                                        return 1;
                                    } catch (error) {
                                        if (error.message.includes("No player was found")) {
                                            ctx.source.sendFailure(Component.red("Player not found!"));
                                        } else {
                                            console.error(`Unexpected error: ${error.message}`);
                                            ctx.source.sendFailure(Component.red("An unexpected error occurred."));
                                        }
                                        return 0;
                                    }
                                })
                        )
                )
        );
    });
}

function giveItems(player, items) {
    try {
        items.forEach(item => {
            if (item.id) player.give(Item.of(item.id, item.count || 1));
        });
        player.server.tell(Text.of(`Items from '${items[0].command}' given to ${player.getName().getString()}`));
    } catch (error) {
        console.error(`Error giving items: ${error.message}`);
        player.server.tell(Text.of(`Error giving items from '${items[0].command}': ${error.message}`));
    }
}

function manageCommandState(player, commandName, action, state) {
    if (!player.persistentData.contains(commandSubcategory)) {
        player.persistentData.put(commandSubcategory, {});
    }

    const data = player.persistentData.get(commandSubcategory);

    switch (action) {
        case 'canRun':
            return !state || data.get(commandName) === null || data.get(commandName) === false;
        case 'markRun':
            data.putBoolean(commandName, true);
            break;
        case 'clearRun':
            data.remove(commandName);
            break;
    }
}