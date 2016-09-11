'use strict';

// Transform snake case of category to a readable one
Vue.filter('transformCategory', function(value){
    var transfomedSyntax = ''
    if('most_likely') transfomedSyntax = 'Most Likely';
    else if('likely') transfomedSyntax = 'Likely';
    else transfomedSyntax = 'Less Likely';
    return transfomedSyntax;
});

// Transform syntax of integer to "P x,xxx" format
Vue.filter('toPesos', function(value){
    return 'P' + value.toLocaleString();
});

// trasformAmountnsform milliseconds to readable date
Vue.filter('transformDate', function(value){
    if(value == 0) return "Not yet asked";
    else return new Date(value).toDateString();
});

new Vue({
    el: 'body',
    data:{
        showSettings: false,
        counter: 1,
        addPartnerInfo:{
            nameField: '',
            askedField: '',
            intendedAmountField: '',
            givenAmountField: '',
            categoryField: '',
            statusField: '',
            remarksField: ''
        },
        editPartnerInfo:{
            name: '',
            index: 0,
            nameField: '',
            askedField: '',
            intendedAmountField: '',
            givenAmountField: '',
            categoryField: '',
            statusField: '',
            remarksField: ''
        },
        partners: [],
        inputName: '',
        name: '',
        inputAmount: '',
        totalAmount: 0,
        inputNation: '',
        nation: ''
    },

    computed:{

        pledgePercentage: function(){
            return this.round((this.pledgeNumeric/this.totalAmount)*100,2);
        },

        pledgeNumeric: function(){
            var pledge = 0;
            if(this.partners){
                this.partners.forEach(function(element, index, array){
                  if (element.hasOwnProperty('intendedAmount')) {
                    pledge += element.intendedAmount;
                  }
                });
            }

            return (pledge - this.remittedNumeric);
        },

        remittedPercentage: function(){
            return this.round((this.remittedNumeric/this.totalAmount)*100,2);
        },

        remittedNumeric: function(){
            var remitted = 0;
            if(this.partners){
                this.partners.forEach(function(element, index, array){
                  if (element.hasOwnProperty('givenAmount')) {
                    remitted += element.givenAmount;
                  }
                });
            }
            return remitted;
        },

        totalPercentage : function(){
            return this.round((this.totalNumeric/this.totalAmount)*100,2);
        },

        totalNumeric: function(){
            return (this.pledgeNumeric + this.remittedNumeric);
        },

        peoplePartnered: function(){
            return _.differenceWith(this.partners, [{ 'status': 'not_yet' }, { 'status': 'declined' }], _.isMatch).length;
        },

        potentialPartners: function(){
            if(this.partners) return this.partners.length;
            else return '0';
        },

        mostLikelyPartners: function(){
            return _.differenceWith(this.partners, [{ 'category': 'less_likely' }, { 'category': 'likely' }], _.isMatch);
        },

        likelyPartners: function(){
            return _.differenceWith(this.partners, [{ 'category': 'less_likely' }, { 'category': 'most_likely' }], _.isMatch);
        },

        lessLikelyPartners: function(){
            return _.differenceWith(this.partners, [{ 'category': 'likely' }, { 'category': 'most_likely' }], _.isMatch);
        }
    },

    methods:{
        // Round number according to precision
        round: function(number, precision){
            var factor = Math.pow(10, precision);
            var tempNumber = number * factor;
            var roundedTempNumber = Math.round(tempNumber);
            return roundedTempNumber / factor;
        },

        // Show settings container
        toggleSettings: function(){
            this.showSettings = !this.showSettings;
            $("label[for='input-nation']").addClass('active');
        },

        // Download current data to data.json
        saveData: function(){
            var data = {};
            var dataDetails = "data:text/json;charset=utf-8,";
            var downloadAnchorTag = document.getElementById('download-file');

            // Initialize Object for Download
            data.name = this.name;
            data.nation = this.nation;
            data.totalAmount = this.totalAmount;
            data.partners = this.partners;

            dataDetails += encodeURIComponent(JSON.stringify(data));

            downloadAnchorTag.setAttribute("href", dataDetails);
            downloadAnchorTag.setAttribute("download", "data.json");
            downloadAnchorTag.click();
        },

        // Search for the array index of the chosen partner
        searchPartner: function(partnerArray,name){
            // Return index of partner to find
            for(var i = 0; i < partnerArray.length; i++) {
                if(partnerArray[i].name == name) return i;
            }
        },

        // Update Ten Days name, nation, and totalAmount settings
        saveSettings: function(){
            var inputAmount = ''+this.inputAmount;

            // Update name of Ten Days missioner
            if(this.inputName){
                this.name = this.inputName;
            }

            // Update total amount needed to raise for the trip
            if(inputAmount != 0){
                if(inputAmount.includes(',')){
                    inputAmount = inputAmount.replace(',','');
                    this.totalAmount = Number.parseInt(inputAmount);
                }
                else this.totalAmount = Number.parseInt(this.inputAmount);
            }

            // Update name of nation
            if(this.inputNation){
                this.nation = this.inputNation;
            }

            Materialize.toast('Settings saved.', 2500);

            // Store to window.localStorage for backup purposes
            this.storeToLocalStorage();
        },

        // Prompt Add Partner modal
        promptAddModal: function(category){
            $('#add-partner-modal').openModal();
            this.addPartnerInfo.categoryField = category;
            this.addPartnerInfo.statusField = 'not_yet';
        },

        // Store added partner to local variables
        addPartner: function(){
            var arrayString = '';

            if(this.addPartnerInfo.nameField){
                var intendedAmountField = this.addPartnerInfo.intendedAmountField;
                var givenAmountField = this.addPartnerInfo.givenAmountField;

                if(intendedAmountField.includes(',')) intendedAmountField = intendedAmountField.replace(',','');
                if(givenAmountField.includes(',')) givenAmountField = givenAmountField.replace(',','');

                this.partners.push(
                    {
                        'name': this.addPartnerInfo.nameField,
                        // 'asked': Date.now(),
                        'asked': '',
                        'intendedAmount': intendedAmountField == '' ? 0 : Number.parseInt(intendedAmountField),
                        'givenAmount': givenAmountField == '' ? 0 : Number.parseInt(givenAmountField),
                        'category': this.addPartnerInfo.categoryField,
                        'status': this.addPartnerInfo.statusField,
                        'remarks': this.addPartnerInfo.remarksField
                    }
                );

                Materialize.toast(this.addPartnerInfo.nameField + ' was just added',2500);

                // Empty fields for new addition of partners
                this.addPartnerInfo.nameField = '';
                this.addPartnerInfo.intendedAmountField = '';
                this.addPartnerInfo.givenAmountField = '';
                this.addPartnerInfo.remarksField = '';

                // Store to window.localStorage for backup purposes
                this.storeToLocalStorage();
            }
        },

        // Prompt Edit Partner modal
        promptEditModal: function(category,name){
            var index = this.searchPartner(this.partners,name);

            this.editPartnerInfo.name = name;
            this.editPartnerInfo.index = index;
            this.editPartnerInfo.categoryField = category;
            this.editPartnerInfo.nameField = this.partners[index].name;
            this.editPartnerInfo.askedField = this.partners[index].asked;
            this.editPartnerInfo.intendedAmountField = this.partners[index].intendedAmount;
            this.editPartnerInfo.givenAmountField = this.partners[index].givenAmount;
            this.editPartnerInfo.statusField = this.partners[index].status;
            this.editPartnerInfo.remarksField = this.partners[index].remarks;

            $("label[for='edit-partner'], label[for='edit-intendedAmount'], label[for='edit-givenAmount'], label[for='edit-remarks']").addClass('active');
            $('#edit-partner-modal').openModal();
        },

        // Update data on partner
        editPartner: function(){
            var index = this.editPartnerInfo.index;
            var intendedAmountField = this.editPartnerInfo.intendedAmountField;
            var givenAmountField = this.editPartnerInfo.givenAmountField;

            if(typeof intendedAmountField === 'string' && intendedAmountField.includes(',')) intendedAmountField = intendedAmountField.replace(',','');
            if(typeof givenAmountField === 'string' && givenAmountField.includes(',')) givenAmountField = givenAmountField.replace(',','');

            this.partners[index].name = this.editPartnerInfo.nameField;
            this.partners[index].asked = this.editPartnerInfo.askedField;
            this.partners[index].intendedAmount = intendedAmountField == '' ? 0 : Number.parseInt(intendedAmountField);
            this.partners[index].givenAmount = givenAmountField == '' ? 0 : Number.parseInt(givenAmountField);
            this.partners[index].category = this.editPartnerInfo.categoryField;
            this.partners[index].status = this.editPartnerInfo.statusField;
            this.partners[index].remarks = this.editPartnerInfo.remarksField;

            $('#edit-partner-modal').closeModal();
            Materialize.toast(this.editPartnerInfo.nameField + ' edited',2500);

            // Store to window.localStorage for backup purposes
            this.storeToLocalStorage();
        },

        // Prompt Delete Partner confirmation modal
        promptDeleteModal: function(){
            $('#delete-partner-confirmation-modal').openModal();
        },

        // Delete partner from list
        deletePartner: function(){
            var partner = this.partners[this.editPartnerInfo.index];
            this.partners.$remove(partner);

            $('#delete-partner-confirmation-modal').closeModal();
            $('#edit-partner-modal').closeModal();
            Materialize.toast(this.editPartnerInfo.nameField + ' removed from your list',2500);

            // Store to window.localStorage for backup purposes
            this.storeToLocalStorage();
        },

        // Check if window.localStorage exists and is available for use
        storageAvailable: function(type) {
        	try {
        		var storage = window[type],
        			x = '__storage_test__';
        		storage.setItem(x, x);
        		storage.removeItem(x);
        		return true;
        	}
        	catch(e) {
        		return false;
        	}
        },

        // Store current data to window.localStorage
        storeToLocalStorage: function(){

            if (this.storageAvailable('localStorage')) {
                // Yippee! We can use localStorage awesomeness
                localStorage.name = this.name;
                localStorage.nation = this.nation;
                localStorage.totalAmount = this.totalAmount;
                localStorage.partners = JSON.stringify(this.partners);
            }
            else {
                // Too bad, no localStorage for us
                console.warn('window.localStorage is not available.');
            }
        }
    },

    created: function(){

        var vm = this;

        if (this.storageAvailable('localStorage')) {

            if(localStorage.getItem('name')) vm.name = localStorage.getItem('name');
            else vm.name = 'Your Beautiful Name';

            if(localStorage.getItem('nation')) vm.nation = localStorage.getItem('nation');
            else vm.nation = 'Hongkong';

            if(localStorage.getItem('totalAmount')) vm.totalAmount = Number.parseInt(localStorage.getItem('totalAmount'));
            else vm.totalAmount = 56400;

            if(localStorage.getItem('partners')) vm.partners = JSON.parse(localStorage.getItem('partners'));
            else vm.partners = [];
        }

        else {
            vm.name = 'Your Beautiful Name';
            vm.nation = 'Hongkong';
            vm.totalAmount = 56400;
            vm.partners = [];
        }

        // Initialize input field fields to default values
        vm.inputName = vm.name;
        vm.inputNation = vm.nation;
        vm.inputAmount = vm.totalAmount;

        // Reads from the json file then stores it to corresponding local variables
        // function readTextFile(file) {
        //     var rawFile = new XMLHttpRequest();
        //     rawFile.open("GET", file);
        //     rawFile.onreadystatechange = function(){
        //         if(rawFile.readyState === 4){
        //
        //             // Read from data.json
        //             if(rawFile.status === 200 || rawFile.status == 0){
        //
        //                 var allText = rawFile.responseText;
        //                 var initData = JSON.parse(allText);
        //
        //                 vm.nation = initData.nation;
        //                 vm.totalAmount = initData.totalAmount;
        //                 vm.partners = initData.partners;
        //
        //                 // Initialize input field fields to default values
        //                 vm.inputNation = initData.nation;
        //                 vm.inputAmount = initData.totalAmount;
        //
        //                 // Store to window.localStorage for backup purposes
        //                 vm.storeToLocalStorage();
        //             }
        //         }
        //
        //         // Or read from localStorage
        //         else{
        //             vm.nation = localStorage.getItem('nation');
        //             vm.totalAmount = localStorage.getItem('totalAmount');
        //             vm.partners = JSON.parse(localStorage.getItem('partners'));
        //
        //             // Initialize input field fields to default values
        //             vm.inputNation = vm.nation;
        //             vm.inputAmount = vm.totalAmount;
        //         }
        //     }
        //     rawFile.send(null);
        // }
        //
        // // Load data from json file if there is any
        // readTextFile("data.json");
    },
});
