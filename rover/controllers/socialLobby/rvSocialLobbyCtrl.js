sntRover.controller('RVSocialLobbyCtrl', [
    '$scope',
    '$rootScope',
    '$filter',
    'RVSocilaLobbySrv',
    '$timeout',
    '$state',
    'ngDialog',
    function($scope, $rootScope, $filter, RVSocilaLobbySrv, $timeout, $state, ngDialog) {

        BaseCtrl.call(this, $scope);

        $scope.posts = [];
        $scope.postParams = {'page': 1, 'per_page': 20};
        $scope.selectedPost = "";
        $scope.newPost = "";
        $scope.middle_page1 = 2, $scope.middle_page2 = 3, $scope.middle_page3 = 4;
        $scope.$emit("updateRoverLeftMenu", "sociallobby");
        $scope.textInQueryBox = "";
        $scope.showSearchResultsArea = false;
        $scope.searchResultsCount = 0;
        $scope.isSearchFocussed = false;
        $scope.match_count = 0;
        
        var deleteIndex = "";

        var POST_LIST_SCROLL = 'post-list-scroll';
        var scrollHeight = "";

        var setPostScrollHeight = function() {
            var postContainer = angular.element(document.querySelector(".neighbours-post-container"))[0];
            var postScroll = angular.element(document.querySelector(".neighbours-post-scroll"))[0];
            var posts = postContainer.children;
            
            var height = 80 * posts.length + 40;

            _.each($scope.posts, function(post){
                if(typeof post.expandedHeight !== "undefined" && post.expandedHeight !== ""){
                    height = height + post.expandedHeight;                
                }
            });
            if(scrollHeight == "")
                scrollHeight = postScroll.clientHeight;
            var scrollHt = "";

            if($scope.errorMessage != "" && typeof $scope.errorMessage != 'undefined'){
                scrollHt = scrollHeight - 140;

            }else{
                scrollHt = scrollHeight - 100;

            }
            postScroll.style.height = ""+scrollHt+"px";
            postContainer.style.height = ""+height+"px";
            
        };
        

        var refreshPostScroll = function(scrollUp) {
            
            setTimeout(function() {
                setPostScrollHeight();
                $scope.refreshScroller(POST_LIST_SCROLL);
                if (scrollUp &&  $scope.myScroll.hasOwnProperty(POST_LIST_SCROLL) ) {
                    $scope.myScroll[POST_LIST_SCROLL].scrollTo(0, 0, 100);
                }                

            }, 500);
            
        };

        var getNextPostWithComments = function(index) {
            
            for (var i = index; i < $scope.posts.length; i++) {
                if ($scope.posts[i].comments.length > 0) {
                    return $scope.posts[i];
                }
            };
            return "";
        };

        $scope.$on("socialLobbyHeightUpdated", function(event, data) {
            $scope.posts[data.index].expandedHeight = data.height;

            if ( data.isSearchResultsView && data.index < $scope.posts.length - 1 ) {
                var nextPost = getNextPostWithComments(data.index + 1);

                if ( nextPost != "" ) {
                    setTimeout(function() {
                
                        nextPost.isExpanded = true;
                        nextPost.isSearchResults = true;
                        $scope.$broadcast("SL_SEARCH_UPDATED", {"post_id": nextPost.id});
                        $scope.$apply();
                    }, 500);
                }  else {
                    refreshPostScroll(true); 
                }           
                
            } else {
               refreshPostScroll(); 
            }
            
        });

        $scope.$on("SL_ERROR", function(event, error) {
            $scope.errorMessage = error;
        });

        
        var setScroller = function() {
            var scrollerOptions = {
                tap: true,
                preventDefault: false
            };

            $scope.setScroller(POST_LIST_SCROLL, scrollerOptions);
        };

        setScroller();

        $scope.fetchPosts = function() {
            $scope.errorMessage = "";
            var options = {};

            options.params = $scope.postParams;
            options.onSuccess = function(data) {
                
                $scope.posts = data.results.posts;
                $scope.totalPostPages = data.results.total_count % $scope.postParams.per_page > 0 ? Math.floor(data.results.total_count / $scope.postParams.per_page) + 1 : Math.floor(data.results.total_count / $scope.postParams.per_page);
                $scope.$emit('hideLoader');
                refreshPostScroll(true);
            };
            $scope.callAPI(RVSocilaLobbySrv.fetchPosts, options);
        };

        $scope.fetchPosts();

        var clearSearchResults = function(){
            $scope.textInQueryBox = "";
            $scope.showSearchResultsArea = false;
            $scope.searchResultsCount = 0;
            $scope.isSearchFocussed = false;
            $scope.match_count = 0;
        };

        $scope.refreshPosts = function(){
            clearSearchResults();
            $scope.postParams.page = 1;
            $scope.middle_page1 = 2, $scope.middle_page2 = 3, $scope.middle_page3 = 4;
            $scope.newPost = "";
            $scope.fetchPosts();
        };

        $scope.addPost = function() {
            $scope.errorMessage = "";
            var options = {};

            options.params = {
                "post": {
                "post_message": $scope.newPost,
                "body_html": "testtt"
            }};
            options.onSuccess = function() {

                $scope.refreshPosts();
            };
            $scope.callAPI(RVSocilaLobbySrv.addPost, options);
        };

        $scope.goToStayCard = function(reservation_id, confirm_no, event) {
            event.stopPropagation();
            $state.go("rover.reservation.staycard.reservationcard.reservationdetails", {
                id: reservation_id,
                confirmationId: confirm_no,
                isrefresh: false
            });
        };

        $scope.getProfessionStringForUser = function(user) {
            var professionString = "";

            if (user.profession != null && user.profession != "")
                professionString = professionString + user.profession;
            if (user.works_at != "" && user.works_at != null)
                professionString = professionString != "" ? professionString + ", " + user.works_at : user.works_at;

            return professionString;
        };

        $scope.deletePostClicked = function(post_id) {
            $scope.errorMessage = "";
            deleteIndex = post_id;
            ngDialog.open({
                   template: '/assets/partials/socialLobby/rvSLPostDelete.html',
                   className: 'ngdialog-theme-default single-calendar-modal',
                   scope: $scope,
                   closeByDocument: true});
        };
        $scope.closeDialog = function() {
            ngDialog.close();
        };
        $scope.delete = function() {
            $scope.errorMessage = "";
            var options = {};

            options.params = {'post_id': deleteIndex};
            options.onSuccess = function() {
                
                $scope.refreshPosts();
                ngDialog.close();
            };
            options.failureCallBack = function(error) {

                $scope.errorMessage = error;
                ngDialog.close();
            };
            $scope.callAPI(RVSocilaLobbySrv.deletePost, options);
        };

        $scope.paginatePosts = function(page) {
            $scope.errorMessage = "";
            if (page == $scope.postParams.page)
                return;
            $scope.postParams.page = page;
            if ($scope.textInQueryBox.length >=  3) {
                
                search();
            }else{
                $scope.fetchPosts();
            }
            
            if ($scope.postParams.page > $scope.middle_page3 && $scope.postParams.page < $scope.totalPostPages) {
                $scope.middle_page3++;
                $scope.middle_page2++;
                $scope.middle_page1++;
            } else if ($scope.postParams.page < $scope.middle_page1 && $scope.postParams.page > 1) {
                $scope.middle_page3--;
                $scope.middle_page2--;
                $scope.middle_page1--;
            } else if ($scope.postParams.page == 1) {
                $scope.middle_page3 = 4;
                $scope.middle_page2 = 3;
                $scope.middle_page1 = 2;
            } else if ($scope.postParams.page == $scope.totalPostPages && $scope.totalPostPages > 5) {
                $scope.middle_page3 = $scope.totalPostPages - 1;
                $scope.middle_page2 = $scope.totalPostPages - 2;
                $scope.middle_page1 = $scope.totalPostPages - 3;
            }
        };

        $scope.togglePostDetails = function(post) {
            $scope.errorMessage = "";

            if(!post.isExpanded) {
                post.isExpanded = true;
            }else if(post.isSearchResults) {
                post.isSearchResults = false;
                post.isExpanded = false;
                post.expandedHeight = "";
                setTimeout(function() {
                        post.isExpanded = true;
                        $scope.$apply();
                    }, 500);
                // $scope.$broadcast("ExpandComments", {"post_id": post.id});
            }else{
                post.isExpanded = false;
                post.expandedHeight = "";
                refreshPostScroll();
            }
        };

        $scope.$watch(function() {
            return $scope.errorMessage;
        }, function() {
                
                refreshPostScroll();
            }
        );

        var search = function(){

            var options = {};

            options.params = $scope.postParams;
            options.params.search = $scope.textInQueryBox;
            $scope.errorMessage = "";
            options.onSuccess = function(data){
                
                $scope.posts = data.results.posts;
                $scope.match_count = data.results.matched_count;
                // $scope.$apply();
                var nextPost = getNextPostWithComments(0);

                if ( nextPost != "" ) {
                        nextPost.isExpanded = true;
                        nextPost.isSearchResults = true;
                        $scope.$broadcast("SL_SEARCH_UPDATED", {"post_id": nextPost.id});
                }
                $scope.totalPostPages = data.results.total_count % $scope.postParams.per_page > 0 ? Math.floor(data.results.total_count / $scope.postParams.per_page) + 1 : Math.floor(data.results.total_count / $scope.postParams.per_page);
                $scope.$emit('hideLoader');
                
            };
            $scope.callAPI(RVSocilaLobbySrv.search, options);
        
        };

        $scope.queryEntered = function() {

            if ($scope.textInQueryBox.length === 0 ) {
                $scope.refreshPosts();
                return;
            }
            if(!$scope.showSearchResultsArea) {
                $scope.showSearchResultsArea = true;
                $scope.postParams.page = 1;
                $scope.middle_page1 = 2, $scope.middle_page2 = 3, $scope.middle_page3 = 4;
            }
            if ($scope.textInQueryBox.length >=  3) {
                
                search();
            }

        };

    }

]);
