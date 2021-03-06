/**
 * @fileOverview screeps
 * Created by piers on 28/04/2020
 * @author Piers Shepperson
 */
const gc = require("gc");
const gf = require("gf");
const state = require("state");
const RoomFlag = require("flag_room");
const StateCreep = require("./state_creep");

class StateHarvesterBuild extends StateCreep {
    constructor(creep) {
        super(creep);
    }

    enact() {
        //console.log(this.creep.namne, "in", "STATE_HARVESTER_BUILD")
        if (state.spaceForHarvest(this.creep)) {
            //console.log("switch to STATE_HARVESTER_HARVEST", this.creep.store.getFreeCapacity(RESOURCE_ENERGY))
            this.switchTo( gc.STATE_HARVESTER_HARVEST);
        }
        const fRoom = new RoomFlag(this.targetPos.roomName);
        const scPos = gf.roomPosFromPos(fRoom.getSourceContainerPos(this.targetId));
        //console.log("scPos of contienr", JSON.stringify(scPos) )
        const container = state.findContainerAt(scPos);
        if (container) {
            return this.switchTo( gc.STATE_HARVESTER_TRANSFER)
        }

        let site = state.findContainerConstructionAt(gf.roomPosFromPos(scPos, this.creep.room.name));
        //console.log("site from findContainerConstructionAt", site);
        if (!site) {
            const ok = scPos.createConstructionSite(STRUCTURE_CONTAINER);
            if (!ok) {
                return;
            }
            site = state.findContainerConstructionAt(scPos);
            if (!site) {
                return;
            }
        }

        const result = this.creep.build(site);
        switch (result) {
            case OK:                        // The operation has been scheduled successfully.
                break;
            case  ERR_NOT_OWNER:            // You are not the owner of this creep, or the room controller is owned or reserved by another player..
                return gf.fatalError("ERR_NOT_OWNER");
            case ERR_BUSY:                  // The creep is still being spawned.
                return gf.fatalError("ERR_BUSY");
            case ERR_NOT_ENOUGH_RESOURCES:          // The target does not contain any harvestable energy or mineral..
                //console.log(this.creep.name,"details",JSON.stringify(this.creep.store))
                //console.log("pos", JSON.stringify(site.pos), "site", JSON.stringify(site));
                //console.log("store", JSON.stringify(this.creep.store))
                return;
            //return gf.fatalError("ERR_NOT_ENOUGH_RESOURCES");
            case ERR_INVALID_TARGET:        // 	The target is not a valid source or mineral object
                // assume target is invalid because its built.
                //console.log(this.creep.name,"details",JSON.stringify(this.creep.store))
                //console.log("site", JSON.stringify(site));
                //console.log("site", JSON.stringify(site));
                //console.log("pos", JSON.stringify(site.pos));
                //console.log("store", JSON.stringify(this.creep.store))
                //console.log("STATE_HARVESTER_BUILD build returned ERR_INVALID_TARGET");
                gf.fatalError("STATE_HARVESTER_BUILD returned ERR_INVALID_TARGET");
                this.switchTo(gc.STATE_HARVESTER_TRANSFER);
                break;
            //return gf.fatalError("ERR_INVALID_TARGET");
            case ERR_NOT_IN_RANGE:          // The target is too far away.
                return gf.fatalError("ERR_NOT_IN_RANGE");
            case ERR_NO_BODYPART:        // There are no WORK body parts in this creep’s body.
                return gf.fatalError("ERR_NO_BODYPART");
            default:
                return gf.fatalError("no valid result");
        }
        //console.log(this.creep.name,"sucessful build");
    };

}

module.exports = StateHarvesterBuild;