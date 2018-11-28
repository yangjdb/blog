(function(){
    function setArticleH(btnReadmore,posi){
        var winH = $(window).height();
        var articleBox = $("div.article_content");
        var artH = articleBox.height();
        if(artH > winH*posi){
            articleBox.css({
                'height':winH*posi+'px',
                'overflow':'visibility'
            })
            articleBox.removeAttr("style");
            $(this).parent().remove();
        }else{
            btnReadmore.parent().remove();
        }
    }
    var btnReadmore = $("#btn-readmore");
    if(btnReadmore.length>0){
        if(currentUserName){
            setArticleH(btnReadmore,3);
        }else{
            setArticleH(btnReadmore,1.2);
        }
    }

    $('.recommend-box').css('display', 'none');
    $('.hide-article-box').css('display', 'none');
})()
