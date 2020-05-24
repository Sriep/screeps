/**
 * @fileOverview screeps
 * Created by piers on 28/04/2020
 * @author Piers Shepperson
 */

const gc = require("gc");
const gf = require("gf");
const state = require("state");

function StateUpgraderIdle (creep) {
    this.creep = creep;
    this.state = gc.STATE_UPGRADER_IDLE;
    this.policyId = creep.memory.policyId;
    this.m = this.creep.memory;
    this.homeId = Memory.policies[this.policyId].roomName;
}

StateUpgraderIdle.prototype.enact = function () {
    const home = Game.rooms[this.homeId];
    //console.log(this.creep.name, "STATE_UPGRADER_IDLE");

    const UpgradePost = state.findFreeUpgraderPost(home);
    //console.log("STATE_UPGRADER_IDLE found post", JSON.stringify(UpgradePost))
    if (UpgradePost) {
        return this.goUpgrade(UpgradePost);
    }

    if (state.atUpgradingPost(this.creep.pos)) {
        //console.log("STATE_UPGRADER_IDLE at UpgradingPost", JSON.stringify(this.creep.pos))
        const upgradeContainerPoses = state.getControllerPosts(home.controller.id);
        for (let cPos of upgradeContainerPoses) {
            const upgradeContainer = state.findContainerAt(gf.roomPosFromPos(cPos, this.homeId));
            if (upgradeContainer.store.getUsedCapacity(RESOURCE_ENERGY) !== 0) {
                for (let i in upgraders) {
                    if (upgraders.memory.targetPos.x === this.creep.x
                        && upgraders.memory.targetPos.y === this.creep.y) {
                        delete upgraders.memory.targetPos;
                        state.switchTo(upgraders, gc.STATE_UPGRADER_IDLE);
                    }
                }
                this.creep.memory.targetId = home.controller.id;
                this.creep.memory.targetPos = this.creep.pos;
                return state.switchTo(this.creep, gc.STATE_UPGRADER_UPGRADE);
            }
        }
    }
};

StateUpgraderIdle.prototype.goUpgrade = function (post) {
    const home = Game.rooms[this.homeId];
    if (!post) {
        post =  state.findFreeUpgraderPost(home);
    }
    if (!post) {
        return;
    }
    this.creep.targetId = home.controller.id;
    const newPos = gf.roomPosFromPos({x: post.x, y:post.y, roomName: home.name});
    return state.switchToMovePos(
        this.creep,
        newPos,
        0,
        gc.STATE_UPGRADER_UPGRADE
    );
};

module.exports = StateUpgraderIdle;































