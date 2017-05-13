class Catalog
{
    constructor()
    {
        let searchInput = document.getElementById('search-catalog');
        if (searchInput) {
            searchInput.addEventListener('keyup', this.search);
        }
    }

    search(elm)
    {
        let word = elm.getAttribute('value');
        console.log(word);
        let threads = document.querySelectorAll('.thread-box');
        if (word.length === 0) {
            threads.show();
        } else {
            threads.hide();
            threads.forEach(function(elm)
            {
                if (elm.find('h3').innerHTML.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                    elm.show();
                    return true;
                }
                if (elm.find('.post').innerHTML.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                    elm.show();
                    return true;
                }
            });
        }
    }
}
export default Catalog;
