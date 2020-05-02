/**
 * @fileOverview screeps
 * Created by piers on 28/04/2020
 * @author Piers Shepperson
 */

const race_porter = {

    CCM_COST: 150,

    bodyCounts: function (ec) {
        let Cs = 0, Ms = 0;
        const ccmBlocks = Math.floor(ec/this.CCM_COST);
        Cs += 2*ccmBlocks;
        Ms += ccmBlocks;
        if (Cs + Ms > 50) {
            Cs = 33; Ms = 17
        }
        return {"work": 0, "carry": Cs, "move" : Ms}
    }
}

module.exports = race_porter;