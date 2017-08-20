function startApp() {
    sessionStorage.clear();
    showView();

    $('#phonebookLink').click(listPhonebooks);
    $('#addUserLink').click(ViewAddUserLink);
    $('#logoutLink').click(logoutUser);

    // Bind the form submit button
    $('#formLogin').submit(loginUser);
    // при submit се хваща не бутона, а цялата форма
    $('#formRegister').submit(registerUser);
    $('#AddPhonebook').click(createPhonebook);
    $('#buttonEditPhonebook').click(editPhonebook);

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    const kinveyBaseUrl = 'https://baas.kinvey.com/';
    const kinveyAppKey = 'kid_B1AMWxWLW';
    const kinveyAppSecret = 'd289bdbbf011487eae19cf6935ee1841';
    const kinveyAppAuthHeaders = {
        'Authorization': 'Basic ' + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    function saveAuthInSession(userInfo) {
        sessionStorage.setItem('username', userInfo.username);
        sessionStorage.setItem('authToken', userInfo._kmd.authtoken);
        sessionStorage.setItem('userId', userInfo._id);
        $('#loggedInUser').text(`Welcome to your phonebook, ${userInfo.username}!`);
    }
    
    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show();
        },
        ajaxStop: function () {
            $('#loadingBox').hide();
        }
    });

    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).fadeIn(500);
    }

    function ajaxError(response) {
        let errorMsg = JSON.stringify(response);
        if(response.readyState === 0)
            errorMsg = 'Cannot connect duo to network error.';
        if(response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showError(errorMsg) {
        $('#errorBox').show();
        $('#errorBox').text('Error: ' + errorMsg)
        setTimeout(function () {
            $('#errorBox').fadeOut(1000);
        }, 2000);
    }

    $('#loginLink').click(function () {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
        $('#phoneBookHeader').text('Phonebook - Login');
        $('#menu').append($('#viewLogin'));
        $('#viewRegister').hide();
    });

    $('#registerLink').click(function () {
        showView('viewRegister');
        $('#formRegister').trigger('reset');
        $('#phoneBookHeader').text('Phonebook - Registration');
        $('#viewLogin').hide();
        $('#menu').append($('#viewRegister'));
    });
    
    function getKinveyAuthHeaders() {
        return {
            "Authorization" : "Kinvey " + sessionStorage.getItem('authToken')
        }
    }

    function showInfo(message) {
        $('#infoBox').show();
        $('#infoBox').text(message);
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function loginUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val(),
        };
        $('#phoneBookHeader').text('Phonebook');
        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey + '/login',
            data: JSON.stringify(userData),
            headers: kinveyAppAuthHeaders,
            contentType: 'application/json',
            success: loginUserSuccess,
            error: ajaxError
        });
        function loginUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            $('#phoneBookHeader').text('Phonebook - ' + userInfo.username);
            $('main').show();
            $('#viewHome').attr('class', 'animated flipInX');
            $('#userMenu').attr('class', 'animated fadeInLeft');
            $('#viewPhonebook').attr('class', 'animated fadeInRight');
            showView('viewHome, #userMenu');
            $('#formLogin').trigger('reset');
            $('#menu').fadeOut();
            listPhonebooks();
            showInfo('Login successful.');
        }
    }

    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey,
            data: JSON.stringify(userData),
            headers: kinveyAppAuthHeaders,
            contentType: 'application/json',
            success: registerUserSuccess,
            error: ajaxError
        });

        function registerUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            $('#formRegister').trigger('reset');
            $('#phoneBookHeader').text('Phonebook - ' + userInfo.username);
            $('#viewHome, #userMenu, #viewPhonebook').show();
            $('#viewHome').attr('class', 'animated flipInX');
            $('#userMenu').attr('class', 'animated fadeInLeft');
            $('#viewPhonebook').attr('class', 'animated fadeInRight');
            $('main').show();
            $('#menu').fadeOut();
            listPhonebooks();
            showInfo('User Registration successful.');

            saveAuthInSession(userInfo);
            $('#phoneBookHeader').text('Phonebook - ' + userInfo.username);
            $('#viewHome, #userMenu, #viewPhonebook').show();
            $('#viewHome').attr('class', 'animated flipInX');
            $('#userMenu').attr('class', 'animated fadeInLeft');
            $('#viewPhonebook').attr('class', 'animated fadeInRight');
            //showView('viewHome, #userMenu');
            $('#formLogin').trigger('reset');
            $('#menu').fadeOut();
            listPhonebooks();
            showInfo('Login successful.');
        }
    }
    
    function listPhonebooks() {
        $('#phonebook').empty();
        $('#viewPhonebook').fadeIn(1000);
        $('#viewCreatePhonebook').hide();
        $('#viewEditPhonebook').hide();

        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/phonebook",
            headers: getKinveyAuthHeaders(),
            success: displayPhonebooks,
            error: ajaxError
        });
    }
    
    function displayPhonebooks(phonebook) {
        let table = $(`
                <table>
                    <tr>
                        <th>User</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </table>`);

        table.hide();
        table.fadeIn(1000);

        for(let user of phonebook) {
            let links = [];
            if(user._acl.creator === sessionStorage.getItem('userId')) {
                let deleteLink = $('<button id="deleteButton">Delete</button>').click(function () {
                    deletePhonebookById(user._id);
                });
                let editLink = $('<button id="editButton">Edit</button>').click(function () {
                    loadPhonebookForEdit(user._id);
                });
                links.push(deleteLink, editLink);
                let tr = $('<tr>');
                let userTd = $('<td>').text(user.name);
                let phoneTd = $('<td>').text(user.phone);
                let actionsTd = $('<td>').append(links);
                tr.append(userTd, phoneTd, actionsTd);
                table.append(tr);
                $('#phonebook').append(table);
            }
        }
    }

    function deletePhonebookById(userId) {

        $.ajax({
            method: 'DELETE',
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/phonebook/" + userId,
            headers: getKinveyAuthHeaders(),
            success: deletePhonebookSuccess,
        });

        function deletePhonebookSuccess() {
            showInfo('User deleted.');
            listPhonebooks();
        }
    }

    function loadPhonebookForEdit(userId) {
        $.ajax({
            method: 'GET',
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/phonebook/" + userId,
            headers: getKinveyAuthHeaders(),
            success: loadPhonebookForEditSuccess,
            error: ajaxError
        });

        function loadPhonebookForEditSuccess(phonebook) {
            $('#formEditPhonebook input[name=id]').val(phonebook._id);
            $('#formEditPhonebook input[name=user]').val(phonebook.name);
            $('#formEditPhonebook input[name=phone]').val(phonebook.phone);
            $('#viewPhonebook').hide();
            $('#viewEditPhonebook').fadeIn(1000);
        }
    }
    
    function ViewAddUserLink() {
        $('#formCreatePhonebook').trigger('reset');
        $('#viewPhonebook').hide();
        $('#viewCreatePhonebook').fadeIn(1000);
        $('#viewEditPhonebook').hide();
    }
    
    function logoutUser() {
        sessionStorage.clear();
        $('#phoneBookHeader').text('Phonebook');
        $('#menu').show();
        $('main').hide();
        showInfo('Logout success!');
    }


    function createPhonebook() {
        let userInfo = {
            name: $('#formCreatePhonebook input[name=user]').val(),
            phone: $('#formCreatePhonebook input[name=phone]').val(),
        };
        if($('#formCreatePhonebook input[name=user]').val().length == 0 || $('#formCreatePhonebook input[name=phone]').val().length == 0) {
            showError('Please fill in the fields!');
        }
        else {
            $.ajax({
                method: 'POST',
                data: JSON.stringify(userInfo),
                url: 'https://baas.kinvey.com/appdata/kid_B1AMWxWLW/phonebook',
                contentType: 'application/json',
                headers: getKinveyAuthHeaders(),
                success: createPhonebookSuccess,
                error: ajaxError
            });
        }
    }
    function createPhonebookSuccess() {
         showInfo('User "' + $('#formCreatePhonebook input[name=user]').val() + '" created succesfull.');
         listPhonebooks();
    }

    function editPhonebook() {
        const url = 'https://baas.kinvey.com/appdata/kid_B1AMWxWLW/phonebook/';
        let userInfo = {
            name: $('#formEditPhonebook input[name=user]').val(),
            phone: $('#formEditPhonebook input[name=phone]').val(),
        };
        if($('#formEditPhonebook input[name=user]').val().length == 0 || $('#formEditPhonebook input[name=phone]').val().length == 0) {
            showError('Please fill in the fields!');
        }
        else {
            $.ajax({
                method: 'PUT',
                data: JSON.stringify(userInfo),
                // id на hidden poleto!
                url: url + $('#formEditPhonebook input[name=id]').val(),
                contentType: 'application/json',
                headers: getKinveyAuthHeaders(),
                success: editPhonebookSuccess
            });
        }
    }
    function editPhonebookSuccess() {
        showInfo('User edited successful.');
        listPhonebooks();
    }

}



