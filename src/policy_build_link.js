/**
 * @fileOverview screeps
 * Created by piers on 05/05/2020
 * @author Piers Shepperson
 */

//const gf = require("gf");
const gc = require("gc");
const policy = require("policy");

// constructor
function Policy  (id, data) {
    this.type = gc.POLICY_BUILD_LINK;
    this.id = id;
    this.home = data.home;
    this.m = data.m;
}

// runs first time policy is created only
Policy.prototype.initilise = function () {
    if (!this.m) {
        this.m = {}
    }
    this.m.finished = false;
    this.home = Memory.policies[this.parentId].roomName;
    const room = Game.rooms[this.home];
    return !!room && !!room.controller && room.controller.my;
};

// runs once every tick
Policy.prototype.enact = function () {
    if (Game.time % gc.BUILD_CHECK_RATE !== 0) {
        return;
    }
    const room = Game.rooms[this.home];
    const rcl = room.controller.level;
    const allowedLinks = CONTROLLER_STRUCTURES[STRUCTURE_LINK[rcl]];
    const links = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_LINK }
    });
    if (links.length >= allowedLinks) {
        this.m.finished = true;
        return;
    }

    const beingBuilt  = room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: { structureType: STRUCTURE_LINK }
    });
    if (links.length + beingBuilt.length >= allowedLinks) {
        return;
    }
    switch (links.length + beingBuilt.length) {
        case 0:
            this.firstLinkPos();
            break;
        case 1:
            this.secondLinkPos();
            break;
        default:
            console.log("POLICY_BUILD_LINK not supported yet", links.length + beingBuilt.length)
    }

    const wantedLinks = allowedLinks - storage.length - beingBuilt.length;
    policy.buildStructuresLooseSpiral(room, STRUCTURE_STORAGE, wantedLinks, 0);
};

Policy.prototype.firstLinkPos = function() {
    const room = Game.rooms[this.home];
    let source;
    const sources = room.find(FIND_SOURCES);
    if (sources.length === 1) {
        source = source[0];
    } else {
        const path = [];
        for (let source of sources) {
            path.push(room.findPath(source.pos, room.controller.pos).length)
        }
        source = path[0] > path[1] ? sources[0] : sources[1];
    }
    const containerPos = state.getSourceContainer(source.id);
    const terrain = room.getTerrain();
    let adjacent = 0;
    let linkPos;
    for (let delta of gc.ONE_MOVE) {
        if (terrain.get(containerPos.x+delta.x, containerPos.y+delta.y) !== TERRAIN_MASK_WALL) {
            if (adjacent === 0) {
                adjacent++
            } else {
                linkPos = new RoomPosition(containerPos.x+delta.x, containerPos.y+delta.y, room.name);
                break;
            }
        }
    }
    linkPos.createConstructionSite(STRUCTURE_LINK);
    Game.flags[source.id].memory.linkPos = linkPos;
};

Policy.prototype.secondLinkPos = function() {
    const room = Game.rooms[this.home];
    const terrain = room.getTerrain();
    const posts = state.getControllerPosts(room.controller.id);
    let linkPos;
    for (let delta of gc.ONE_MOVE) {
        if (terrain.get(posts.x+delta.x, posts.y+delta.y) !== TERRAIN_MASK_WALL) {
            linkPos = new RoomPosition(posts.x+delta.x, posts.y+delta.y, room.name);
            break;
        }
    }
    linkPos.createConstructionSite(STRUCTURE_LINK);
    Game.flags[room.controller.id].memory.linkPos = linkPos;
};

Policy.prototype.draftReplacment = function() {
    return this.m.finished ? false : this;
};

module.exports = Policy;




























































