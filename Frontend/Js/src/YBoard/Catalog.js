class Catalog
{
    constructor()
    {
        let searchInput = document.getElementById('search-catalog');
        if (searchInput) {
            searchInput.addEventListener('keyup', this.search);
        }
    }

    search(e)
    {
        let elm = e.target;
        let word = elm.value;
        let threads = document.querySelectorAll('.thread-box');

        if (word.length === 0) {
            threads.show();
        } else {
            threads.hide();
            threads.forEach(function(elm)
            {
                if (elm.querySelector('h3').innerHTML.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                    elm.show();
                    return true;
                }
                if (elm.querySelector('.post').innerHTML.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                    elm.show();
                    return true;
                }
            });
        }
    }
}
export default Catalog;
