const chalk = require('chalk');

module.exports = function (pool, knex) {
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
            return {
                status: 'error',
                message: 'no shoe provided'
            };
        }

        try {
            var found = await findShoe(shoe);
            if (found) {
                console.log(chalk.bgRed.white('shoe already exists'));
                return {
                    status: 'error',
                    message: 'shoe already exists'
                };
            }
            await pool.query('insert into shoes (brand, colour, size, price, qty) \
                values ($1, $2, $3, $4, $5)',
                [shoe.brand, shoe.colour, shoe.size, shoe.price, shoe.qty]
            );
            return { status: 'success', message: 'shoe added successfully' };
        } catch (err) {
            console.log(chalk.bgRed.white(err));
            return { status: 'error', error: err.stack };
        }
    }

    async function updateShoe(shoe) {
        var found = await findShoe(shoe);

        try {
            if (!found) {
                return {
                    status: 'error',
                    error: 'unknown shoe'
                };
            }

            await pool.query('update shoes set brand=$1, colour=$2, \
                size=$3, price=$4, qty=$5 where id=$6',
                [shoe.brand, shoe.colour, shoe.size, shoe.price, shoe.qty, found.id]
            );
            return {
                status: 'success',
                message: 'update successful'
                
            }
        }
        catch (err) {
            return {
                status: 'error',
                error: err.stack
            }
        }
    }

    async function getShoes(params) {
        try {
            if (params && Object.keys(params).length > 0) {
                
                let q = 'select * from shoes where ';
                let props = Object.entries(params);
                for (let prop of props) {
                    let [key, value] = prop;
                    q = props.indexOf(prop) == 0 ? q + `${key}='${value}'` : q + ` and ${key}='${value}'`;
                }
                let results = await pool.query(q);
                return {
                    status: 'success',
                    items: results.rows
                };
            }
            // otherwise bring back everything
            const result = await pool.query('select * from shoes order by brand');
            return {
                status: 'success',
                items: result.rows
            };
        } catch (err) {
            return {
                status: 'error',
                error: err.stack
            }
        }
    }

    async function findShoe(shoe) {
        var results = {};
        results = await pool.query('select * from shoes \
            where brand=$1 and colour=$2 and size=$3',
            [shoe.brand, shoe.colour, shoe.size]
        );
        return results.rows[0];
    }

    return {
        addShoe,
        updateShoe,
        getShoes
    }
}