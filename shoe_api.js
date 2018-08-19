const db_conx = require('./config/dbconnection');
const chalk = require('chalk');
const fs = require('fs');

module.exports = function () {

    const pool = db_conx();

    async function reset_db() {
        try {
            let sql = fs.readFileSync('./config/shoe_api.sql').toString();
            await pool.query(sql);
            console.log(
                chalk.bgGreen.white('DB RESET SUCCESSFUL')
            );
        } catch (err) {
            console.log(
                chalk.bgRed.white('RESET ERROR'), err);
        }
    }
    // SHOE VALIDATION
    // function isShoe(shoe) {
    //     if (Object.values(shoe).includes(undefined) || Object.entries(shoe).length < 5) {
    //         return false;
    //     } 
    //     return true;
    // }

    async function addShoe(shoe) {

        if (!shoe) {
            console.log(chalk.bgRed.white('no shoe provided'));
            return 'no shoe provided';
        }

        try {
            var found = await findShoeById(shoe);

            if (found.length > 0) {
                console.log(chalk.bgRed.white('shoe already exists'));
                return 'shoe already exists';
            }
            await pool.query('insert into shoes (brand, colour, size, price, qty) \
                values ($1, $2, $3, $4, $5)',
                [shoe.brand, shoe.colour, shoe.size, shoe.price, shoe.qty]
            );
            console.log(chalk.bgGreen.white('shoe added successfully'));
            return 'shoe added successfully';
        } catch (err) {
            console.log(chalk.bgRed.white(err));
            return 'could not process the request';
        }
    }

    async function updateShoe(shoe) {

        let found = await findShoeById(shoe);

        if (found.length < 1) {
            return 'unknown shoe';
        }
        try {

            for (let [field, value] of Object.entries(shoe)) {

                pool.query('update shoes set ' + field + '=\'' + value + '\' where id=' + found[0].id)
                    .then(res => {
                        console.log(chalk.bgBlue.white('updated shoe', field))
                    })
                    .catch(err => {
                        console.log(chalk.bgBlue.white('failed on field:', field))
                    });
            }
            console.log(chalk.bgGreen.white('update successful'))
            return 'update successful';

        } catch (err) {
            return 'update failed';
        }
    }

    async function findShoeById(shoe) {
        let results = await pool.query('select * from shoes where brand=$1 and colour=$2 and size=$3',
            [shoe.brand, shoe.colour, shoe.size]
        );
        return results.rows;
    }

    async function addToCart(shoe) {
        try {
            // find in shoes
            let found = await findShoeById(shoe);

            // clean-up crew
            if (found.length < 1) {
                return 'unknown shoe';
            }
            if (found[0].qty < 1) {
                return 'out of stock';
            }
            if ((found[0].qty - shoe.qty) > 0) {
                return `there are only ${found[0].qty} shoes left in stock`;
            }

            // find in cart
            let cartMatch = await pool.query('select * from cart where shoe_id=$1',
                [found[0].id]
            );

            if (cartMatch.rowCount < 1) {
                // add to cart
                await pool.query('insert into cart (shoe_id, qty, subtotal) \
                    values ($1, 1, $2)',
                    [found[0].id, subTotal]
                );
                return 'added to cart';
            }

            // update entry
            await pool.query('update cart set qty=qty+1, subtotal=$1 where id=$2',
                [cartMatch.rows[0].s, cartMatch.rows[0].id]
            );
            return 'cart updated';

        } catch (err) {
            return 'failed to add to cart';
        }
    }

    async function end() {
        await pool.end();
    }

    return {
        reset_db,
        addShoe,
        updateShoe,
        addToCart,
        end
    }
}