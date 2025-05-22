String.prototype.empty = function(){

    var str = this;

    if(str == undefined) return true;
    if(!str.length) return true;
    if(str == null || str == '' || str.length == 0 || str == NaN) return true;

    return false;

};

String.prototype.strip_tags = function(){

    var str = this;

    if(str.empty()){
        return null;
    }

    return str.replace(/<\/?[^>]+>/gi, '').trim();

};

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

const mask = {

    phone : (value) => {

        if(value == undefined){
            console.error('[MASK ERROR PHONE INVALID VALUE]', value);
            return value;
        }

        value = value.toString().strip_tags().toString();

        if(value.empty()){
            console.error('[MASK ERROR PHONE INVALID VALUE]', value);
            return value;
        }

        if(value.length < 10 || value.length > 11){
            console.error('[MASK ERROR PHONE INVALID VALUE]', value);
            return value;
        }

        if(value.length == 10){
            value = value.splice(2, 0, '9');
        }

        if(value.length == 11){
            return `(${value.slice(0, 2)}) ${value.slice(2,3)} ${value.slice(3,7)}-${value.slice(7,11)}`;
        }

    },

    money : (value) => {

        if(value == undefined || value == null){
            console.error('[MASK ERROR MONEY INVALID VALUE]', value);
            return value;
        }

        value = parseFloat(value);

        if(isNaN(value)){
            console.error('[MASK ERROR MONEY INVALID VALUE]', value);
            return value;
        }

        value = value.toFixed(2).split('.');
        value[0] = "R$ " + value[0].split(/(?=(?:...)*$)/).join('.');
        
        return value.join(',');

    },

    unMaskMoney : (value) => {
        return value.replace('R$ ', '').trim();
    }

};

export default mask;