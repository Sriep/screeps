    /**
 * @fileOverview screeps
 * Created by piers on 27/04/2020
 * @author Piers Shepperson
 */
const gc = require("./gc");

const race_harvester = {
    bodyCounts: function (ec) {
        if (ec < gc.MIN_HARVESTER_EC) {
            return undefined;
        }
        if (ec > gc.MAX_HARVESTER_EC) {
            return gc.HARVESTER_BODY_COUNTS[gc.MAX_HARVESTER_EC];
        }
        return gc.HARVESTER_BODY_COUNTS[Math.floor(ec/50) * 50];
    }
};

module.exports = race_harvester;