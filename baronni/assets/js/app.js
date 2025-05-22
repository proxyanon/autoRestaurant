import Main from './Main.class.js';
import Db from './Db.class.js';
import mask from './mask.js';

Array.prototype.lastValue = function() {
    var arr = this;
    return arr[arr.length-1];
}

// instalacao do service worker
if('serviceWorker' in navigator){

    console.log('[*] func serviceWorker exits...');

    navigator.serviceWorker.register('./sw.js')
        .then(function(reg) {
            console.log('Registration succeeded. Scope is ' + reg.scope);
        })
        .catch(function(err) {
            console.log('Registration failed with ' + err);
        });

}

Notification.requestPermission(function(status){

    if(status == 'denied'){
        alert('Você não vai receber atualizações dos pedidos!');
    }

});

const displayNotification = (title, options) => {

    if(Notification.permission == 'granted' && 'serviceWorker' in navigator){
        navigator.serviceWorker.getRegistration().then(function(reg) {
            reg.showNotification(title, options);
        });
    }

};

//setup database
var request = indexedDB.open('db_carrinho', 3);

request.addEventListener('upgradeneeded', e => {

    window.db = e.target.result;

    window.db.createObjectStore('produtos', { keyPath : 'produto_id' });
    window.db.createObjectStore('usuario', { keyPath : 'usuario_id' });

    document.dispatchEvent(new CustomEvent('db_ready', { detail : db }));

});

request.addEventListener('success', e => {

    window.db = e.target.result;

    document.dispatchEvent(new CustomEvent('db_ready', { detail : db }));

});

request.addEventListener('error', err => {
    console.error(err);
});

document.addEventListener('db_ready', function(e){

    var database = new Db(Main.generate_id());
    var pageLoadEvent;
    var loaded = false;

    document.addEventListener('navigation', function(e){
        
        pageLoadEvent = new CustomEvent('page_load', { detail : e.detail });

        if(loaded){
            document.dispatchEvent(pageLoadEvent);
        }

    });

    var app_uri = document.location.protocol + '//' + document.location.hostname + ':8443';
    var app = new Main('home', app_uri);

    if(localStorage.getItem('current-page') == 'loading'){
        app.navigate('home', [], true);
    }

    // SPA
    document.addEventListener('page_load', function(e){

        var page_name = e.detail.page_name;
        var data = e.detail.data;

        switch(page_name){

            case 'home':

                app.getCompanies()
                    .then(resp => resp.json())
                    .then(results => {
                        
                        var rs = results.results;
                        var companies_html = '';

                        rs.forEach((data) => {

                            companies_html += `<li class="list-inline-item btn-companie" id="${data.id}">` + '\n';
                            companies_html += ` <img src="${data.logotipo}" class="header-establishment">` + '\n';
                            companies_html += '</li>' + '\n';

                        });

                        document.querySelector('#list-companies').innerHTML = companies_html;

                        [...document.querySelectorAll('.btn-companie')].forEach(function(el){
        
                            el.addEventListener('click', function(e){
                        
                                var companie_id = e.currentTarget.id;
                        
                                app.navigate('companies', { companie_id : companie_id });
                        
                            });
                        
                        });

                    })
                    .catch(err => {
                        console.error('[getCompanies error] :', err);
                    });
                
                app.getPromo()
                    .then(resp => resp.json())
                    .then(results => {

                        if(results.error){
                            console.log('[LOAD_EMPTY_PROMO]');
                            return;
                        }

                        var rs = results.results;
                        var promo_html = '';

                        rs.forEach((data) => {

                            promo_html += '<li class="list-inline-item border border-1 product-item rounded bg-white">' + '\n';
                            promo_html += ' <div class="row">' + '\n';
                            promo_html += '     <div class="col-12">' + '\n';
                            promo_html += `         <img src="${data.imagem}" class="w-100"/>` + '\n';
                            promo_html += '     </div>' + '\n';
                            promo_html += '     <div class="col-12">' + '\n';
                            promo_html += '         <div class="p-2">' + '\n';
                            promo_html += `             <p class="p-0 m-0 text-muted">${data.nome}</p>` + '\n';
                            promo_html += `             <p class="p-0 m-0 text-decoration-line-through text-muted">R$ ${parseFloat(data.preco).toFixed(2).replace('.', ',')}</p>` + '\n';
                            promo_html += `             <p class="p-0 m-0 fw-bold fs-5">R$ ${parseFloat(data.precoDesconto).toFixed(2).replace('.', ',')}</p>` + '\n';
                            promo_html += '         </div>' + '\n';
                            promo_html += '     </div>' + '\n';
                            promo_html += ' </div>' + '\n';
                            promo_html += '</li>' + '\n';

                        });

                        document.querySelector('#list-promo').innerHTML = promo_html;

                    })
                    .catch(err => {
                        console.error('[getPromo error] :', err);
                    });

                var profile = database.selectAll('usuario');

                profile.onsuccess = e => {

                    var results = e.target.result;

                    if(results.length>0){

                        results = results[0];
                        var percent = parseFloat((rs.pedidos_concluidos/10)*100).toFixed(2);

                        if(percent.split('.')[1] == '00'){
                            percent = percent.split('.')[0];
                        }

                        document.querySelector('#home-d-pontos').textContent = rs.pontos;
                        document.querySelector('.progress-bar').style.width = percent + '%';
                        document.querySelector('.progress-bar').textContent = percent + '%';

                    }else{

                    }

                };

                profile.onerror = err => {
                    console.error(err);
                };

            case 'profile' :

                var profile = database.selectAll('usuario');

                profile.onsuccess = e => {

                    var results = e.target.result;

                    if(results.length>0){

                        results = results[0];

                        document.querySelector('#lbl-profile-nome').textContent = results.nome;
                        document.querySelector('#lbl-profile-telefone').textContent = results.telefone;
                        document.querySelector('#lbl-profile-endereco').textContent = results.endereco;
                        document.querySelector('#lbl-profile-bairro').textContent = results.bairro;
                        document.querySelector('#lbl-profile-ponto-referencia').textContent = results.ponto_referencia;
                        document.querySelector('#lbl-profile-pontos').textContent = results.pontos;

                    }else{
                        
                        page_name == 'profile' ? document.getElementById('btn-m-perfil').click() : null;

                    }

                };

                profile.onerror = err => {
                    console.error(err);
                };

            break;

            case 'purchases':

                app.getPurchases(1)
                    .then(resp => resp.json())
                    .then(results => {

                        var rs = results.results;
                        var purchase_html = '';

                        rs.forEach((data) => {

                            purchase_html += '<li class="list-group-item">' + '\n';
                            purchase_html += '    <div class="row">' + '\n';
                            purchase_html += '        <div class="col-4">' + '\n';
                            purchase_html += `            <img src="${data.imagem}" class="w-100">` + '\n';
                            purchase_html += '        </div>' + '\n';
                            purchase_html += '        <div class="col-8">'+ '\n';
                            purchase_html += `            <p class="d-block my-0 py-0" style="font-size:14px;">${data.nome} <span class="float-right text-muted" style="font-size: 13px;">+10 pontos</span></p>`+ '\n';
                            purchase_html += `            <p class="d-block my-0 py-0 text-muted" style="font-size:14px;">R$ ${parseFloat(data.preco).toFixed(2).replace('.', ',')}</p>`+ '\n';
                            purchase_html += `            <p class="d-block my-0 py-0 text-muted" style="font-size:14px;"><i class="fa fa-credit-card"></i> ${data.forma_pagamento}</p>`+ '\n';
                            purchase_html += `            <sub class="float-right text-muted">${data.data} às ${data.hora}</sub>`+ '\n';
                            purchase_html += '        </div>'+ '\n';
                            purchase_html += '    </div>'+ '\n';
                            purchase_html += '</li>'+ '\n';

                        });

                        document.querySelector('#list-purchases').innerHTML = purchase_html;

                    })
                    .catch(err => {
                        console.error('[getPurchases error] :', err);
                    });

            break;

            case 'companies':
                
                if(data.companie_id == undefined){
                    
                    if(localStorage.getItem('companie-id')){
                        data.companie_id = localStorage.getItem('companie-id');
                    }

                }                

                app.getCompanies(data.companie_id)
                    .then(resp => resp.json())
                    .then(results => {

                        if(results.error){
                            console.warn('[EMPTY_LOAD_COMPANIES]');
                            return;
                        }

                        var rs = results.results[0];

                        document.querySelector('#lbl-companie-nome').textContent = rs.nome;
                        document.querySelector('#lbl-companie-telefone').textContent = rs.telefone;
                        document.querySelector('#lbl-companie-rating').innerHTML = '<i class="fa fa-star"></i> ' + parseFloat(rs.rating).toFixed(1).replace('.', '.');
                        document.querySelector('#img-companie').src = rs.logotipo;

                        localStorage.setItem('companie-id', rs.id);


                    })
                    .catch(err => {
                        console.error('[getCompanies error] :', err);
                    });

                //CARRINHO
                document.addEventListener('products_loaded', function(event){

                    var produtos = database.selectAll('produtos');

                    produtos.onsuccess = e => {
                        
                        var results = e.target.result;
                            
                        if(results.length>0){
                            
                            document.querySelector('#bnt-checkout-popup').classList.contains('animation-border-fade') == false ? document.querySelector('#bnt-checkout-popup').classList.add('animation-border-fade') : null;
                            
                            results.forEach((data) => {
                                try{
                                    document.getElementById('prd@' + data.empresa_id + '#' + data.produto_id + '@' + data.tipo).innerHTML = '<i class="fa fa-check"></i>';
                                }catch(e){
                                    console.warn('[CARRINHO_EM_OUTRA_EMPRESA]');
                                }
                            });

                        }

                    };

                    produtos.onerror = err => {
                        console.error(err);
                    };

                    //CARRINHO
                    [...document.querySelectorAll('.btn-add-checkout')].forEach((el) => {
                        el.addEventListener('click', function(e){                                                        

                            var data = e.currentTarget.id;

                            var companie_id = data.split('@')[1].split('#')[0];
                            var product_id = data.split('@')[1].split('#')[1];
                            var product_type = data.split('@')[2];

                            var produtos = database.put('produtos', {
                                produto_id:product_id,
                                empresa_id:companie_id,
                                tipo:product_type
                            });

                            produtos.onsuccess = e => {
                                console.log('[+] adicionado ao carrinho');
                                document.querySelector('#bnt-checkout-popup').classList.contains('animation-border-fade') == false ? document.querySelector('#bnt-checkout-popup').classList.add('animation-border-fade') : null;
                            };
    
                            produtos.onerror = err => {
                                console.error('[indexDB error] : ', err);
                                document.querySelector('#bnt-checkout-popup').classList.contains('animation-border-fade') == false ? document.querySelector('#bnt-checkout-popup').classList.add('animation-border-fade') : null;
                            };

                            document.getElementById(data).innerHTML = '<i class="fa fa-check"></i>';

                        });
                    });

                });

                app.getProducts(data.companie_id, 'CARDAPIO')
                    .then(resp => resp.json())
                    .then(results => {

                        if(results.error){
                            console.warn('[EMPTY_LOAD_PRODUCTS]');
                            return;
                        }

                        var rs = results.results;
                        var products_html = '';

                        rs.forEach((data) => {

                            if(data.desconto > 0){
                                data.precoDesconto = data.preco - data.desconto;
                            }

                            products_html += `<li class="list-group-item">` + '\n';
                            products_html += `  <div class="row">` + '\n';
                            products_html += `      <div class="col-4">` + '\n';
                            products_html += `          <img src="${data.imagem}" class="w-100">` + '\n';
                            products_html += `      </div>` + '\n';
                            products_html += `      <div class="col">` + '\n';
                            products_html += `          <p class="m-0 p-0">${data.nome}</p>` + '\n';
                            products_html += `          <p class="text-muted m-0 p-0 ${data.desconto > 0 ? 'text-decoration-line-through' : ''}">R$ ${Main.formatPrice(data.preco)}</p>` + '\n';
                            if(data.desconto > 0){
                                products_html += `          <span class="fw-bold">R$ ${Main.formatPrice(data.precoDesconto)}</span>` + '\n';
                            }
                            products_html += `          <button class="btn btn-success float-right btn-add-checkout" id="prd@${data.empresa_id}#${data.id}@${data.tipo}"><i class="fa fa-plus"></i> Adicionar</button>` + '\n';
                            products_html += `      </div>` + '\n';
                            products_html += `  </div>` + '\n';
                            products_html += `</li>` + '\n';

                        });

                        document.querySelector('#list-products-cardapio').innerHTML = products_html;

                    })
                    .catch(err => {
                        console.error('[getProducts error] :', err);
                    });
                
                app.getProducts(data.companie_id, 'BEBIDAS')
                    .then(resp => resp.json())
                    .then(results => {
                        
                        if(results.error){
                            console.warn('[EMPTY_LOAD_PRODUCTS]');
                            return;
                        }

                        var rs = results.results;
                        var products_html = '';

                        rs.forEach((data) => {
                            
                            products_html += `<li class="list-group-item">` + '\n';
                            products_html += `    <div class="row">` + '\n';
                            products_html += `        <div class="col-4">` + '\n';
                            products_html += `            <img src="${data.imagem}" class="w-100">` + '\n';
                            products_html += `        </div>` + '\n';
                            products_html += `        <div class="col">` + '\n';
                            products_html += `            <p class="m-0 p-0">${data.nome}</p>` + '\n';
                            products_html += `            <p class="text-muted m-0 p-0 ${data.desconto > 0 ? 'text-decoration-line-through' : ''}">R$ ${parseFloat(data.preco).toFixed(2).replace('.',',')}</p>` + '\n';
                            if(data.desconto > 0){
                                products_html += `          <span class="fw-bold">R$ ${Main.formatPrice(data.precoDesconto)}</span>` + '\n';
                            }
                            products_html += `            <button class="btn btn-success float-right btn-add-checkout" id="${data.empresa_id}-${data.id}"><i class="fa fa-plus"></i> Adicionar</button>` + '\n';
                            products_html += `        </div>` + '\n';
                            products_html += `    </div>` + '\n';
                            products_html += `</li>` + '\n';

                        });

                        document.querySelector('#list-products-bebidas').innerHTML = products_html;
                        document.dispatchEvent(new CustomEvent('products_loaded'));

                    })
                    .catch(err => {
                        console.error('[getProducts error] :', err);
                    });
                
            case 'search':

                var results = data.results;
                var search_list = '';

                if(results.length>0){
                
                    results.forEach((data) => {
                        
                        search_list += `<li class="list-group-item">` + '\n';
                        search_list += `    <div class="row">` + '\n';
                        search_list += `        <div class="col-3">` + '\n';
                        search_list += `            <img src="${data.imagem}" class="w-100" />` + '\n';
                        search_list += `        </div>` + '\n';
                        search_list += `        <div class="col">` + '\n';
                        search_list += `<p class="p-0 m-0">${data.nome}</p>` + '\n';
                            
                        if(data.desconto>0){
                            search_list += `<p class="p-0 m-0 text-muted text-decoration-line-through">R$ ${Main.formatPrice(data.preco-data.desconto)}</p>` + '\n';
                        }
                        
                        search_list += `           <p class="p-0 m-0">R$ ${Main.formatPrice(data.preco-data.desconto)}</p>` + '\n';
                            
                        search_list += `        </div>` + '\n';
                        search_list += `    </div>` + '\n';
                        search_list += `</li>` + '\n';
                            
                    });
                    
                    document.getElementById('search-list').innerHTML = search_list;
                }else{
                    document.getElementById('search-list').innerHTML = '<li class="list-group-item text-center"><p>Nada encontrado</p></li>';
                }

            case 'loading':

                document.getElementById('app-progress-bar').textContent = data.text;
                document.getElementById('app-progress-bar').style.width = data.progres;

        }

        loaded = true;

    });

    [...document.getElementsByName('chk-forma-pag')].map(function(e){
        
        e.onchange = function(el){
            
            var curr_id = el.currentTarget.id;
            var checked = el.currentTarget.checked;
            var formaPag = curr_id.split('-').lastValue();

            if(formaPag == 'cartao'){
                checked ? document.getElementById('btn-carrinho-do').removeAttribute('disabled')
                : document.getElementById('btn-carrinho-do').setAttribute('disabled', true);
            }else if(formaPag == 'dinheiro'){
                document.getElementById('btn-carrinho-do').setAttribute('disabled', true);
            }
        
            [...document.querySelectorAll('.d-forma-pag-troco')].map(function(dPag){

                if(formaPag == 'dinheiro'){
                    if(checked){
                        dPag.classList.remove('d-none');
                    }
                }else{
                    if(checked){
                        dPag.classList.add('d-none');
                        document.getElementById('chk-forma-pag-troco').checked = false;
                    }
                }

            });

        };

    });

    document.getElementById('chk-forma-pag-troco').addEventListener('click', function(e){
    
        var checked = e.currentTarget.checked;

        if(checked){
            document.querySelectorAll('.d-forma-pag-troco')[1].classList.add('d-none');
            document.getElementById('btn-carrinho-do').removeAttribute('disabled')
        }else{
            document.querySelectorAll('.d-forma-pag-troco')[1].classList.remove('d-none')
        }
    
    });

    document.getElementById('inpt-forma-pag-troco').addEventListener('input', function(e){
        
        var value = parseFloat(e.target.value);

        if(value > 0){

            if(!document.getElementById('chk-forma-pag-troco').checked){
                document.getElementById('btn-carrinho-do').removeAttribute('disabled');
            }else{
                document.getElementById('btn-carrinho-do').setAttribute('disabled', true);
            }

        }else{
            document.getElementById('btn-carrinho-do').setAttribute('disabled', true);
        }

    });

    document.getElementById('btn-carrinho-do').addEventListener('click', function(e){

        var produtos = database.selectAll('produtos');

        produtos.onsuccess = e => {

            var products = e.target.result;

            if(products.length>0){

                var transaction_id = localStorage.getItem('transaction_id') ? localStorage.getItem('transaction_id') : Main.generate_id();
                var payment_method = null;
                var delivery_leftover = parseFloat(document.getElementById('inpt-forma-pag-troco').value);

                localStorage.setItem('transaction_id', transaction_id);

                var profile = database.selectAll('usuario');

                profile.onsuccess = e => {

                    var rs = e.target.result;

                    if(rs.length>0){

                        rs = rs[0];

                        var username = rs.nome;
                        var delivery_address = rs.endereco;
                        var delivery_hood = rs.bairro;
                        var delivery_reference = rs.ponto_referencia;
                        var delivery_phone = rs.telefone;

                        [...document.getElementsByName('chk-forma-pag')].forEach((el) => {

                            if(el.checked){
                                payment_method = el.id.split('-').lastValue().toUpperCase();
                            }
        
                        });

                        app.openTransaction(rs.usuario_id,transaction_id,username,products,payment_method,delivery_address,delivery_hood,delivery_reference,delivery_phone,delivery_leftover)
                            .then(resp => resp.json())
                            .then(result => {

                                if(result.error){

                                }else{
                                    app.commitTransaction(transaction_id);
                                }

                            })
                            .catch(err => {

                            });

                    }else{

                    }

                };

                profile.onerror = err => {

                };

            }else{
                
                alert('Você precisa adicionar items ao carrinho!');
                [...document.getElementsByClassName('btn-close')].forEach((el) => { el.click() });

            }

        };

        produtos.onerror = err => {

        };

    });

    document.querySelector('#inpt-search').addEventListener('input', function(e) {

        let search = e.target.value;
        
        if(!search || search == '' || search == null || search == undefined || search == 0 || search == NaN || search.length == 0){
            app.navigate('search', []);
        }

        app.navigate('loading', { text : 'Carregando...', progres : '10%' });

        app.search(search)
        .then(resp => resp.json())
        .then(results => {
               
            if(results.error){
                   
                console.error(results.msg);
                app.navigate('search', { results : [] });
                
            }else{

                app.navigate('loading', { text : '100%', progres : '100%' });
                app.navigate('search', results);

            }

        })
        .catch(err => {
            console.error(err);
        })

    });

    [...document.getElementsByClassName('btn-nav')].forEach(function(el) {

        el.addEventListener('click', function(e){

            var page_name = e.currentTarget.id.replace('nav-', '');
            app.navigate(page_name);

        });

    });

    [...document.getElementsByClassName('mask-phone')].forEach((el) => {

        el.addEventListener('change', (e) => {
            e.currentTarget.value = mask.phone(e.currentTarget.value);
        });

        el.addEventListener('click', (e) => {
            e.currentTarget.value = mask.phone(e.currentTarget.value);
        });

    });

    document.getElementById('modal-profile').addEventListener('shown.bs.modal', function(e){

        var profile = database.selectAll('usuario');

        profile.onsuccess = e => {

            var results = e.target.result;
            var modal = document.getElementById('modal-profile');

            if(results.length>0){

                results = results[0];
                
                modal.querySelector('#inpt-perfil-nome').value = results.nome;
                modal.querySelector('#inpt-perfil-telefone').value = results.telefone;
                modal.querySelector('#inpt-perfil-endereco').value = results.endereco;
                modal.querySelector('#inpt-perfil-bairro').value = results.bairro;
                modal.querySelector('#inpt-perfil-ponto-referencia').value = results.ponto_referencia;

            }

        };

        profile.onerror = err => {
            console.error(err);
        };

    });

    document.getElementById('modal-carrinho').addEventListener('shown.bs.modal', function(e){

        var produtos = database.selectAll('produtos');

        produtos.onsuccess = e => {
            
            var results = e.target.result;
                
            if(results.length>0){

                var listCarrinho = '';
                var totalEntrega = 5;
                var subTotalPedido = 0;
                var totalPedido = 0;
                
                results.forEach((prd, key) => {                    

                    app.getProducts(prd.empresa_id, prd.tipo, prd.produto_id)
                        .then(resp => resp.json())
                        .then(results => {
                            
                            if(results.error){
                                console.warn('[EMPTY_LOAD_PRODUCTS]');
                                return;
                            }

                            var rs = results.results;

                            rs.forEach((data) => {

                                subTotalPedido += (data.preco-data.desconto);
                                
                                listCarrinho += `<li class="list-group-item">` + '\n';
                                listCarrinho += `   <div class="row">` + '\n';
                                listCarrinho += `       <div class="col-3">` + '\n';
                                listCarrinho += `           <img src="${data.imagem}" class="w-100">` + '\n';
                                listCarrinho += `       </div>` + '\n';
                                listCarrinho += `       <div class="col">` + '\n';
                                listCarrinho += `           <p class="p-0 m-0">${data.nome}</p>` + '\n';
                                if(data.desconto>0){
                                    listCarrinho += `           <p class="p-0 m-0 text-muted text-decoration-line-through">R$ ${Main.formatPrice(data.preco-data.desconto)}</p>` + '\n';
                                }else{
                                    listCarrinho += `           <p class="p-0 m-0">R$ ${Main.formatPrice(data.preco)}</p>` + '\n';
                                }
                                listCarrinho += `       </div>` + '\n';
                                listCarrinho += `       <div class="col-2">` + '\n';
                                listCarrinho += `           <p class="text-muted float-right">x1</p>` + '\n';
                                listCarrinho += `           <button class="btn btn-danger btn-carrinho-remove" id="prdCarrinho@${data.empresa_id}#${data.id}@${data.tipo}"><i class="fa fa-trash"></i></button>` + '\n';
                                listCarrinho += `       </div>` + '\n';
                                listCarrinho += `   </div>` + '\n';
                                listCarrinho += `</li>` + '\n';

                                if(key == rs.length){

                                    totalPedido = subTotalPedido + totalEntrega;
                                
                                    document.getElementById('list-carrinho').innerHTML = listCarrinho;
                                    document.getElementById('lbl-carrinho-subtotal').textContent = `R$ ${Main.formatPrice(subTotalPedido)}`;
                                    document.getElementById('lbl-carrinho-entrega').textContent = `R$ ${Main.formatPrice(totalEntrega)}`;
                                    document.getElementById('lbl-carrinho-total').textContent = `R$ ${Main.formatPrice(totalPedido)}`;
                                
                                }

                            });                          

                        })
                        .catch(err => {
                            console.error('[getProducts error] :', err);
                        });
                });

            }else{
                alert('Você precisa adicionar algum produto!');
                [...document.getElementsByClassName('.')].forEach((el) => { el.click() });
            }

        };

        produtos.onerror = err => {
            console.error(err);
        };

    });

    document.getElementById('btn-perfil-salvar').addEventListener('click', function(e){
    
        var data = {};
        var modal = document.getElementById('modal-profile');

        var nome = modal.querySelector('#inpt-perfil-nome').value;
        var telefone = modal.querySelector('#inpt-perfil-telefone').value;
        var endereco = modal.querySelector('#inpt-perfil-endereco').value;
        var bairro = modal.querySelector('#inpt-perfil-bairro').value;
        var ponto_referencia = modal.querySelector('#inpt-perfil-ponto-referencia').value;

        var profile = database.selectAll('usuario');

        data = {nome,telefone,endereco,bairro,ponto_referencia};

        profile.onsuccess = e => {

            var results = e.target.result;

            if(results.length>0){
                
                var usr_id = results[0].usuario_id;

                if(!Main.check_usr_id(usr_id)){
                    usr_id = Main.generate_id();
                }

                data.usuario_id = usr_id;
            
            }else{
                data.usuario_id = Main.generate_id();
            }

            document.dispatchEvent(new CustomEvent('get_user_id'));

        };

        profile.onerror = err => {

            console.warn(err);
            
            data.usuario_id = Main.generate_id();

            document.dispatchEvent(new CustomEvent('get_user_id'));

        }
        
        document.addEventListener('get_user_id', () => {

            app.checkData(data)
                .then(resp => resp.json())
                .then(results => {

                    if(results.error){
                        alert('Campos inválidos digite novamente.1');
                    }else{

                        var tx = database.put('usuario', data);

                        tx.onsuccess = e => {
        
                            var event = new CustomEvent('navigation', { detail : {
                                page_name : 'profile',
                                data : []
                            } });
            
                            document.getElementById('modal-profile').querySelector('.btn-close').click();
                            document.dispatchEvent(event);
        
                        };
        
                        tx.onerror = err => {
                            console.error(err);
                        };

                    }

                })
                .catch(err => {
                    alert('Campos inválidos digite novamente.2');
                });

        });


    });

    document.dispatchEvent(pageLoadEvent);

});