/**
 * @fileOverview screeps
 * Created by piers on 03/05/2020
 * @author Piers Shepperson
 */

const gc = require("gc");
const gf = require("gf");
const state = require("state");

function State (creep) {
    this.type = gc.STATE_WORKER_RECEIVE;
    this.creep = creep
}

State.prototype.enact = function () {
    //console.log(this.creep.name, "in STATE_WORKER_RECEIVE")
    const harvester = Game.getObjectById(this.creep.memory.targetId);
    if (!harvester || harvester.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY> 0)) {
            return state.switchTo(this.creep, gc.STATE_WORKER_FULL_IDLE);
        } else {
            return state.switchTo(this.creep, gc.STATE_WORKER_IDLE);
        }
    }

    const result = harvester.transfer(this.creep, RESOURCE_ENERGY);
    switch (result) {
        case OK:                        // The operation has been scheduled successfully.
            break;
        case  ERR_NOT_OWNER:            // You are not the owner of this creep, or the room controller is owned or reserved by another player..
            return gf.fatalError("transfer ERR_NOT_OWNER");
        case ERR_BUSY:                  // The creep is still being spawned.
            return gf.fatalError("transfer ERR_BUSY");
        case ERR_NOT_ENOUGH_RESOURCES:          // The target does not contain any harvestable energy or mineral..
            return gf.fatalError("transfer ERR_NOT_ENOUGH_RESOURCES");
        case ERR_INVALID_TARGET:        // 	The target is not a valid source or mineral object
            return gf.fatalError("transfer ERR_INVALID_TARGET");
        case ERR_FULL:        // The extractor or the deposit is still cooling down.
            return state.switchTo(this.creep, gc.STATE_WORKER_FULL_IDLE); // todo improve
        case ERR_NOT_IN_RANGE:          // The target is too far away.
            return state.switchTo(this.creep, gc.STATE_WORKER_IDLE); // todo improve
        case ERR_INVALID_ARGS:        // There are no WORK body parts in this creep’s body.
            return gf.fatalError("transfer ERR_INVALID_ARGS");
        default:
            return gf.fatalError("harvest unrecognised return value");
    }
    state.switchTo(this.creep, gc.STATE_WORKER_FULL_IDLE);
}

module.exports = State;