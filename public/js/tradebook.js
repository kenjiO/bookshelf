/* global $ */
$(document).ready(function() {

    $('#search').click(function(e) {
        var title = $('#titleInput').val().trim();
        if (title) getBooks(title);
    });

    $('#bookResultList').on('click', '.addBookBtn', function(e){
        var bookId = $(this).attr('data-id');
        addBook(bookId);
    } );

});

function getBooks(title) {
    $('#message').text("");
    $('#bookResultList').empty();
    $.getJSON('/api/search', {title: title})
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            $('#message').text(err);
        })
        .done(function(json) {
            if (json.error) {
                $('#message').text(json.error);
            } else if (json.length === 0) {
                $('#message').text('No Results Found');
            } else {
                displayResults(json);
            }           
        })
    ;
}

function displayResults(results) {
    results.forEach(function(book) {
        var authors = Array.isArray(book.authors) ? book.authors.join(', ') : "";
        var html =  '<li>' +
                    '  <div class="bookAddButtonDiv">' +
                    '    <a class="addBookBtn btn btn-primary" data-id="'+book.id+'">Add Book</a>' +
                    '  </div>' +
                    '  <div class="bookImage">' +
                    '    <img src="' + book.thumbnail + '"/>' +
                    '  </div> ' +
                    '  <div class="bookTitleAuthor">' +
                           book.title + '<br />' + authors +
                    '  </div>' +
                    '</li>';
        $('#bookResultList').append(html);
    });
}

function addBook(bookId) {
    $.getJSON('/api/add', {bookId: bookId})
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            $('#message').text(err);
        })
        .done(function(json) {
            if (json.error) {
                $('#message').text(json.error);
            } else {
                window.location.href = window.location.origin;
            }           
        })
    ;
}
