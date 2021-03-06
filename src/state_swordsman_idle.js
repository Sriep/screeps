/**
 * @fileOverview screeps
 * Created by piers on 11/06/2020
 * @author Piers Shepperson
 */
const gc = require("gc");
const gf = require("gf");
const StateCreep = require("./state_creep");

class StateSwordsmanIdle extends StateCreep {
    constructor(creep) {
        super(creep);
    }

    enact() {
        const foreignOffice =  policy.getPolicyByType(gc.POLICY_COLONIAL_OFFICE);
        const roomToPatrol = foreignOffice.nextPatrolRoute(creep);
        this.switchMoveToRoom(roomToPatrol, 20,  gc.STATE_PATROL)
    };
}

module.exports = StateSwordsmanIdle;