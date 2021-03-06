/**
 * @fileOverview screeps
 * Created by piers on 05/05/2020
 * @author Piers Shepperson
 */
//const gf = require("gf");
const C = require("./Constants");
const gc = require("gc");
const policy = require("policy");
const economy = require("economy");
const budget = require("budget");
const race = require("race");
const flag = require("flag");
const race_harvester = require("race_harvester");
const state = require("state");
const FlagRoom = require("flag_room");
const PolicyBase = require("policy_base");

class PolicyPorters  extends PolicyBase {
    constructor (id, data) {
        super(id, data);
        this.type = gc.POLICY_PORTERS;
    }

    initilise() {
        super.initilise();
        this.m.curProduction = {};
        this.m.buildsFinished = false;
        this.m.localBuildsFinished = false;
        return true
    };

    get buildsFinished() {
        return this.m.buildsFinished
    }

    get localBuildsFinished() {
        return this.m.localBuildsFinished
    }

    enact() {
        //console.log("POLICY_PORTERS budget", JSON.stringify( budget.porterRoom(Game.rooms[this.home])));
        //console.log("POLICY_PORTERS resources", JSON.stringify(this.m.resources));
        const room = Game.rooms[this.home];
        ///if (!this.m.resources || (Game.time + this.id) % gc.CALC_ROOM_RESOURCES_RATE !== 0 ) {
        if (room.controller.level <= 4) {
            this.m.resources = this.calcResources(gc.ROOM_NEUTRAL, gc.ROOM_NEUTRAL_ROADS);
        } else {
            this.m.resources = this.calcResources(gc.ROOM_RESERVED, gc.ROOM_RESERVED_ROADS);
        }
        //}
        this.spawns(room, this.m.resources);
        //console.log("POLICY_PORTERS production vector", JSON.stringify(this.m.curProduction))
    };

    spawns(room, resources) {
        //console.log("pp spawns resources", JSON.stringify(resources));
        this.m.buildsFinished = false;

        const harvesters = policy.getCreeps(this.parentId, gc.RACE_HARVESTER).length;
        const workers = policy.getCreeps(this.parentId, gc.RACE_WORKER).length;
        const porters = policy.getCreeps(this.parentId, gc.RACE_PORTER).length;
        const upgraders = policy.getCreeps(this.parentId, gc.RACE_UPGRADER).length;
        const reservers = policy.getCreeps(this.parentId, gc.RACE_RESERVER).length;
        //console.log("pp spawns harvesters",harvesters,"workers",workers,"porters",porters,"upgraders",upgraders);

        const wHarvester = race.creepPartsAlive(this.parentId, gc.RACE_HARVESTER, WORK);
        const cWorker = race.creepPartsAlive(this.parentId, gc.RACE_WORKER, CARRY);
        const cPorter = race.creepPartsAlive(this.parentId, gc.RACE_PORTER, CARRY);
        const wUpgrader = race.creepPartsAlive(this.parentId, gc.RACE_UPGRADER, WORK);
        const rReserver = race.creepPartsAlive(this.parentId, gc.RACE_RESERVER, CLAIM);

        this.m.localBuildsFinished = wHarvester > this.m.localResoures.hW && cPorter>this.m.localResoures.pC
                                && cWorker > this.m.localResoures.wW && wUpgrader>this.m.localResoures.uW;

        console.log("pp spawns harvesters",harvesters,"workers",workers,"porters",porters,
            "reservers",reservers,"pp spawns wHarvester",wHarvester,"cWorker",cWorker,
            "cPorter",cPorter,"rReserver",rReserver);
        //console.log("pp spawns energy",room.energyAvailable,"capacity",room.energyCapacityAvailable);
        console.log("minHarvesters", resources.minHarvesters, "maxHarvesters", resources.maxHarvesters, "minReserves", resources.minReservers);
        flag.getSpawnQueue(this.home).clearMy(this.parentId);

        if (cWorker < 2) {
            console.log("cWorkes < 2",cWorker);
            if (cWorker < C.CREEP_LIFE_TIME/10 || (harvesters === 0 && cPorter === 0 )) {
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_WORKER,
                    room.energyAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_CRITICAL
                );
                return;
            }
        }
        const fRoom = new FlagRoom(this.home);
        const canBuildHarvesters =  (wHarvester < resources.hW || harvesters < resources.minHarvesters) && harvesters <= resources.maxHarvesters;
        const canBuildWorkers = cWorker < resources.wW;

        const isSourceContainer = fRoom.sourceContainerPos.some(s =>
            (state.findContainerAt(s))
        );
        const canBuildPorters = cPorter < resources.pC && isSourceContainer;

        const isUpgradeContainer = fRoom.upgradeContainerPos.some(s =>
            (state.findContainerAt(s))
        );
        const isSpaceForPorterToReachContainer = upgraders < fRoom.upgradePosts.length-2;
        const canBuildUpgrader = wUpgrader < resources.uW && isUpgradeContainer && isSpaceForPorterToReachContainer;

        const canBuildReserver = rReserver < resources.cR - 0.2;
        //console.log("pp upgradeContainerPos", fRoom.upgradePosts.length);
        //console.log("pp wHarvester",wHarvester,"cWorker",cWorker, "cPorter", cPorter,"wUpgrader",wUpgrader,"rReserver",rReserver);

        //console.log("pp spawns canBuildHarvesters", canBuildHarvesters,"harvesters", harvesters, "maxh", resources.maxHarvesters)
        if (canBuildHarvesters
            && (!canBuildWorkers || wHarvester <= cWorker)
            && (!canBuildPorters || wHarvester <= cPorter)
            && (!canBuildUpgrader || wHarvester <= 5*wUpgrader)) {
            //console.log("pp next build harvester","canBuildWorkers",canBuildWorkers,"wHarvester",wHarvester ,"<=cWorker",
            //   cWorker, "canBuildPorters",canBuildPorters,"wHarvester",wHarvester, "<=cPorter", cPorter);
            if (race.getCost(gc.RACE_HARVESTER, room.energyCapacityAvailable) <= room.energyCapacityAvailable) {
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_HARVESTER,
                    room.energyCapacityAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_LOCAL
                );
            }
            return;
        }

        if (canBuildWorkers
            && (!canBuildPorters || cWorker <= cPorter)) {
            if (race.getCost(gc.RACE_WORKER, room.energyCapacityAvailable) <= room.energyAvailable) {
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_WORKER,
                    room.energyCapacityAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_LOCAL
                );
            }
            return;
        }

        if (canBuildPorters
            && (!canBuildUpgrader || cPorter <= 2*wUpgrader)) {
            if (race.getCost(gc.RACE_PORTER, room.energyCapacityAvailable) <= room.energyAvailable) {
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_PORTER,
                    room.energyCapacityAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_LOCAL
                );
            }
            return
        }

        if (canBuildReserver) {
            if (race.getCost(gc.RACE_RESERVER, room.energyCapacityAvailable) <= room.energyAvailable) {
                //console.log("next build reserver", "canBuildReserver",canBuildReserver)
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_RESERVER,
                    room.energyCapacityAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_LOCAL
                );
            }
            return
        }

        if (canBuildUpgrader) {
            if (race.getCost(gc.RACE_UPGRADER, room.energyCapacityAvailable) <= room.energyAvailable) {
                //console.log("next build Upgrader", "canBuildUpgrader",canBuildUpgrader);
                policy.sendOrderToQueue(
                    room,
                    gc.RACE_UPGRADER,
                    room.energyCapacityAvailable,
                    this.parentId,
                    gc.SPAWN_PRIORITY_LOCAL
                );
            }
            return;
        }
        this.m.buildsFinished = true;
    };

    portersCsRoom(useRoad) {
        useRoad = !!useRoad;
        if (this.m.portersCsRoom  && this.m.portersCsRoom[useRoad]) {
            return this.m.portersCsRoom[useRoad]
        } else {
            this.m.portersCsRoom = {};
            this.m.portersCsRoom[true] = budget.portersCsRoom(Game.rooms[this.home], true);
            this.m.portersCsRoom[false] = budget.portersCsRoom(Game.rooms[this.home], false);
        }
    };

    harvesterWsRoom(useRoad) {
        useRoad = !!useRoad;
        if (this.m.harvesterWsRoom && this.m.harvesterWsRoom[useRoad]) {
            return this.m.harvesterWsRoom[useRoad]
        } else {
            this.m.harvesterWsRoom = {};
            this.m.harvesterWsRoom[true] = budget.harvesterWsRoom(Game.rooms[this.home], true);
            this.m.harvesterWsRoom[false] = budget.harvesterWsRoom(Game.rooms[this.home], false);
        }
    };

    upgradersWsRoom(useRoad) {
        useRoad = !!useRoad;
        if (this.m.upgradersWsRoom && this.m.upgradersWsRoom[useRoad]) {
            return this.m.upgradersWsRoom[useRoad]
        } else {
            const room = Game.rooms[this.home];
            this.m.upgradersWsRoom = {};
            this.m.upgradersWsRoom[true] = budget.upgradersWsRoom(room, room.energyCapacityAvailable, true);
            this.m.upgradersWsRoom[false] = budget.upgradersWsRoom(room, room.energyCapacityAvailable, false)
        }
    };

    calcResources() {
        let resources = { hW :0, pC:0, wW:0, uW:0, cR:0 };
        let minHarvesters = 0;
        let maxHarvesters = 0;
        this.m.curProduction = {};
        const governor = policy.getGovernorPolicy(this.home);
        const colonies = governor.colonies;
        for (let colonyObj of colonies) {
            let colonyResources;
            const fRoom = new FlagRoom(colonyObj.name);
            const sources = fRoom.sources;
            for (let id in sources ) {
                minHarvesters++;
                maxHarvesters += fRoom.accessPoints(id);
            }
            if (colonyObj === this.home|| colonyObj.name === this.home) {
                const homeRoom = Game.rooms[this.home];
                const ec = homeRoom.energyCapacityAvailable;
                const sourceEnergyLT = 30000;
                if (ec <= gc.MAX_EC_4WORK_HARVESTER) {
                    const hWperBody = race_harvester.bodyCounts(ec)["work"];
                    let maxWs = 0;
                    for (let source of homeRoom.find(C.FIND_SOURCES)) {
                        maxWs += Math.min(5, fRoom.accessPoints(source.id)*hWperBody);
                    }
                    const budgetWs = this.harvesterWsRoom(homeRoom, false);
                    const ratio = maxWs/budgetWs;
                    colonyResources = this.updateRoomResources(
                        this.home,
                        maxWs,
                        ratio * this.portersCsRoom(homeRoom, false),
                        ratio * this.upgradersWsRoom(homeRoom, sourceEnergyLT)
                    );
                } else {
                    colonyResources = this.updateRoomResources(
                        this.home,
                        this.harvesterWsRoom(homeRoom, false),
                        this.portersCsRoom(homeRoom, false),
                        this.upgradersWsRoom(homeRoom, sourceEnergyLT)
                    );
                }
                colonyResources["cR"] = 0;
                this.m.localResoures = Object.assign({}, colonyResources);
            } else {
                const values = fRoom.value(
                    this.home,
                    !!governor.m.ACTIVITY_COLONY_ROADS,
                    !!governor.m.ACTIVITY_RESERVED_COLONIES,
                    !!governor.m.ACTIVITY_FLEXI_HARVESTERS,
                );
                colonyResources = this.updateRoomResources(
                    colonyObj.name, values.parts.hW, values.parts.pC, values.parts.uW
                );
                colonyResources["cR"] = values.parts["cR"];
            }

            this.m.curProduction[colonyObj.name] = Object.assign({}, colonyResources);
            resources.hW += colonyResources.hW;
            resources.pC +=  colonyResources.pC;
            resources.wW +=  colonyResources.wW;
            resources.uW +=  colonyResources.uW;
            resources.cR += colonyResources.cR
        }
        //console.log("pp minHarvesters1", minHarvesters,"maxHarvesters",maxHarvesters);
        resources.minHarvesters = minHarvesters;
        resources.maxHarvesters = maxHarvesters;
        resources.minReservers = this.m[gc.ACTIVITY_RESERVED_COLONIES] ? colonies.length : 0;
        return resources
    };

    updateRoomResources(roomName, hW, pC, uW) {
        //console.log("updateRoomResources home", home, "hW", hW, "pC", pC, "uW", uW);
        const room = Game.rooms[roomName];
        if (!room) { // todo cache updateRoomResources somehow so can return that if no sight on room
            return { "hW": hW, "pC" : pC, "wW" : 0,  "uW": uW };
        }
        let buildTicks, ratioHtoW;

        const skip = flag.getRoom(roomName).sourceContainerPos;
        buildTicks = economy.constructionRepairLeft(room, skip);
        ratioHtoW = budget.workersRoomRationHtoW(room, Game.rooms[this.home], false);
        let workerWs = 0;
        let porterCs = pC;
        let upgradeWs = uW;
        if (buildTicks > 0) {
            porterCs = 0;
            upgradeWs = 0;
            workerWs = ratioHtoW * hW;
        }
        return { "hW": hW, "pC" : porterCs, "wW" : workerWs,  "uW": upgradeWs };
    };

    localBudget() {
        const room = Game.rooms[this.home];
        const spawnCapacity = Game.rooms[this.home].find(C.FIND_MY_SPAWNS).length
            * C.CREEP_LIFE_TIME / C.CREEP_SPAWN_TIME;
        if (!this.m.localResoures) {
            return {
                "name" : this.home,
                "spawnPartsLT" : spawnCapacity,
            };
        }

        const hbc = race.getBodyCounts(gc.RACE_HARVESTER, room.energyCapacityAvailable);
        const hPartCount = hbc[C.WORK] + hbc[C.MOVE] + hbc[C.CARRY];
        let parts = Math.ceil((this.m.localResoures.hW*11/5)/hPartCount) * hPartCount;

        const pbc = race.getBodyCounts(gc.RACE_PORTER, room.energyCapacityAvailable);
        const pPartCount = pbc[C.WORK] + pbc[C.MOVE] + pbc[C.CARRY];
        parts += Math.ceil((this.m.localResoures.pC*3)/pPartCount) * pPartCount;

        const wbc = race.getBodyCounts(gc.RACE_WORKER, room.energyCapacityAvailable);
        const wPartCount = wbc[C.WORK] + wbc[C.MOVE] + wbc[C.CARRY];
        parts += Math.ceil((this.m.localResoures.wW*3)/wPartCount) * wPartCount;

        const ubc = race.getBodyCounts(gc.RACE_UPGRADER, room.energyCapacityAvailable);
        const uPartCount = ubc[C.WORK] + ubc[C.MOVE] + ubc[C.CARRY];
        parts += Math.ceil((this.m.localResoures.uW*2)/uPartCount) * uPartCount;
        parts += 4; // scouts.

        const ecSources = Game.rooms[this.home].find(C.FIND_SOURCES).length * C.SOURCE_ENERGY_CAPACITY;
        const profit = ecSources * gc.SORCE_REGEN_LT - budget.convertPartsToEnergy(
            this.m.localResoures.hW,
            this.m.localResoures.pC,
            this.m.localResoures.uW,
            this.m.localResoures.wW
        );
        //console.log("local budget",JSON.stringify({
        //    "name" : this.home,
        //    "profit" : profit,
        //    "parts" : parts,
        //    "profitpart" : profit/parts,
        //    "spawnPartsLT" : spawnCapacity,
        //}));
        return {
            "name" : this.home,
            "profit" : profit,
            "parts" : parts,
            "profitpart" : profit/parts,
            "spawnPartsLT" : spawnCapacity,
        };
    };

}

if (gc.USE_PROFILER && !gc.UNIT_TEST) {
    const profiler = require('screeps-profiler');
    profiler.registerClass(PolicyPorters, 'PolicyPorters');
}

module.exports = PolicyPorters;



















