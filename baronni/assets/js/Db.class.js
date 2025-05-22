/** 
 * 
 * @author Daniel Victor Freire Feitosa
 * @version 0.0.1
 * @copyright Baronni, Caruzzo, KeiKei - 2021
 * @package baronni
*/

class Db {

    constructor(randomKey=null){

        if(!window.db){
            throw new Error('[IDBdatabase NOT LOAD ON WINDOW]');
        }

        this.db = window.db;
        this.randomKey = randomKey;

        this.data = {};

    }

    get userKey(){
        return this.data.userKey;
    }

    set userKey(value){
        this.data.userKey = value;
    }

    checkUser(){

        var select = this.selectAll('usuario');

        select.onsucess = e => {
            
            var results = e.target.result;
            
            if(results.length>0){
                this.userKey = results.usuario_id;
            }else{

                var tx = this.add('usuario',{usuario_id : this.randomKey});
                
                tx.onsucess = () => {
                    this.userKey = randomKey;
                };
                
                tx.onerror = err => {
                    console.error('[indexdDB ERROR] : ', err);
                    throw err;
                };
            
            }

        };

        select.onerror = err => {
            throw err;
        };

    }

    selectAll(table){
        return this.db.transaction(table).objectStore(table).getAll();
    }

    select(table, data){
        return this.db.transaction(table).objectStore(table).get(data);
    }

    selectKey(table, key){
        return this.db.transaction(table).objectStore(table).get(key);
    }

    add(table, data){
        return this.db.transaction(table, 'readwrite').objectStore(table).add(data);
    }

    put(table, data){
        return this.db.transaction(table, 'readwrite').objectStore(table).put(data);
    }

    delete(table, key=null){
        return this.db.transaction(table, 'readwrite').objectStore(table).delete(key);
    }

    getUserId(){

        var result = this.selectAll('usuario');

        return new Promise(function(resolve, reject){

            try{

                result.onsucess = e => {
                    
                    var results = e.target.results;

                    if(results.length>0){

                        var usr_id = results.usuario_id;

                        if(usr_id == null || usr_id == '' || usr_id.length == 20){
                            reject(new Error('[INVALID_USER_ID]'));
                        }else{
                            resolve(usr_id);
                        }

                    }else{
                        reject(new Error('[EMPTY_USER_ID]'));
                    }
                    
                };

                result.onerror = err => {
                    reject(new Error(err));
                };

            }catch(err){
                reject(err);
            }

        });


    }

}

export default Db;