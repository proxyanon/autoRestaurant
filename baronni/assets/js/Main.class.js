/** 
 * 
 * @author Daniel Victor Freire Feitosa
 * @version 0.0.1
 * @copyright Baronni, Caruzzo, KeiKei - 2021
 * @package baronni
*/
class Main {

    constructor(default_page='home',api_uri=''){
        
        this.default_page = default_page;
        this.api_uri = api_uri;
        this.pages_show_search_bar = ['home', 'search', 'loading'];

        if(localStorage.getItem('current-page') === null){
            this.navigate(this.default_page);
            //localStorage.setItem('current-page', this.default_page);
        }else{        
            this.navigate(localStorage.getItem('current-page'));
        }

    }

    static formatPrice(price_float,digits=2){
        return parseFloat(price_float).toFixed(digits).replace('.',',');
    }

    static generate_id(len=20){
        return '@' + Array(len+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, len)
    }
    
    static check_usr_id(usr_id){

        if(usr_id == undefined){
            return false;
        }

        if(usr_id.length != 21 || usr_id == '' || usr_id == null){
            return false;
        }

        return true;

    }

    // SPA navigation
    navigate(page_name, array_data=[]){

        [...document.getElementsByClassName('app-page') !== null ? document.getElementsByClassName('app-page') : []].forEach(function(el){
            el.style.display = 'none';
        });

        if(this.pages_show_search_bar.includes(page_name)){
            document.getElementById('app-search-bar').style.display = 'block';
        }else{
            document.getElementById('app-search-bar').style.display = 'none';
        }

        var valid = false;

        try{
            document.getElementById(page_name).style.display = 'block';
            valid = true;
        }catch(e){
            console.error('[navigation error] :', e);
        }

        valid === true ? localStorage.setItem('current-page', page_name) : localStorage.setItem('current-page', this.default_page);

        var event = new CustomEvent('navigation', { detail : {
            page_name : page_name,
            data : array_data
        } });

        document.dispatchEvent(event);

    }

    getRoute(route_name){
        return this.api_uri + '/' + route_name;
    }

    search(value){

        var req_url = this.getRoute('search') + '/' + value;

        return fetch(req_url, 
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        )

    }

    getCompanies(companie_id=null){

        var req_url = this.getRoute('companies');

        if(companie_id != null){
            req_url += '/' + parseInt(companie_id);
        }

        return fetch(req_url, 
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        );

    }

    getProducts(companie_id,product_type=null,product_id=null){

        var req_url = this.getRoute('products') + '/' + companie_id;

        if(product_type != null){
            req_url += '/' + product_type;
        }

        if(product_id != null){
            req_url += '/' + parseInt(product_id);
        }

        return fetch(req_url,
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        );

    }

    getProfile(profile_id){

        return fetch(this.getRoute('profile') + '/' + profile_id,
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        );

    }

    getPurchases(profile_id,purchase_id=null){

        var req_url = this.getRoute('purchases');

        if(profile_id != null){
            req_url += '/' + parseInt(profile_id);
        }

        if(purchase_id != null){
            req_url += '/' + parseInt(purchase_id);
        }

        return fetch(req_url,
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        );

    }

    getPromo(promo_id){

        var req_url = this.getRoute('promo');

        if(promo_id != null){
            req_url += '/' + parseInt(promo_id);
        }

        return fetch(req_url,
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }
        );

    }

    checkData(data){

        return fetch(this.getRoute('check_data'), 
            {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify(data)
            }
        );

    }

    openTransaction(profile_id,transaction_id,username,products,payment_method,delivery_address,delivery_hood,delivery_reference,delivery_phone,delivery_leftover){

        var req_url = this.getRoute('transaction/open');

        if(profile_id.includes('@') && profile_id.length == 21){
            req_url += '/' + profile_id;
        }

        return fetch(req_url, 
            {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify({
                    transaction_id,
                    username,
                    products, 
                    payment_method, 
                    delivery_address,
                    delivery_hood,
                    delivery_reference,
                    delivery_phone, 
                    delivery_leftover
                })
            }    
        )

    }

    commitTransaction(transaction_id){

        var req_url = this.getRoute('transaction/commit');

        if(transaction_id.includes('@') && transaction_id.length == 21){
            req_url += '/' + transaction_id;
        }

        return fetch(req_url, 
            {
                method : 'GET',
                headers : {
                    'Content-Type' : 'application/json'
                }
            }    
        )

    }

}

export default Main;