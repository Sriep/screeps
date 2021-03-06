/**
 * @fileOverview screeps
 * Created by piers on 17/05/2020
 * @author Piers Shepperson
 */
const C = require("./Constants");
const gc = require("gc");
const gf = require("gf");
const lr = require("lab_reactions");
const StateBuilding = require("state_building");

class StateLabIdle extends StateBuilding  {
    constructor(structure) {
        super(structure);
        this.lab = structure;
        this.flag = Game.flags[structure.id];
    }

    enact() {
        const resourceId = lr.resource(this.flag.color, this.flag.secondaryColor);
        if (resourceId) {
            const reagents = lr.reagents(resourceId);
            if (reagents) {
                const lab1s = this.lab.room.find(C.FIND_STRUCTURES, {
                    filter: l => {
                        return l.structureType === C.STRUCTURE_LAB
                            && l.mineralType === reagents[0]
                            && l.store[reagents[0]] > C.LAB_REACTION_AMOUNT
                            && this.lab.pos.inRangeTo(l, gc.RANGE_REACTION) ;
                    }
                });
                const lab2s = this.lab.room.find(C.FIND_STRUCTURES, {
                    filter: l => {
                        return l.structureType === C.STRUCTURE_LAB
                            && l.mineralType === reagents[1]
                            && l.store[reagents[1]] > C.LAB_REACTION_AMOUNT
                            && this.lab.pos.inRangeTo(l, gc.RANGE_REACTION);
                    }
                });
                //console.log(lab.room,"move lab",lab,lab1s, lab2s);
                if (lab1s.length > 0 && lab2s.length > 0) {
                    const result = this.lab.runReaction(lab1s[0], lab2s[0]);
                    console.log("lab reaction result", result);
                    // console.log(lab.room,lab,"runReaction",result);
                }
            }
        }
    };

}





module.exports = StateLabIdle;




















































