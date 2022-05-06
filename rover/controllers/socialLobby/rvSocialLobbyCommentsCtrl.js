sntRover.controller('RVSocialLobbyCommentsCtrl', [
    '$scope',
    '$rootScope',
    '$filter',
    'RVSocilaLobbySrv',
    '$timeout',
    '$state',
    'ngDialog',
    function($scope, $rootScope, $filter, RVSocilaLobbySrv, $timeout, $state, ngDialog) {

        BaseCtrl.call(this, $scope);

        $scope.parentPost = $scope.posts[$scope.$index];
        $scope.comments = [];
        $scope.commentParams = {'page': 1, 'per_page': 10, 'post_id': $scope.parentPost.id};
        $scope.selectedComment = "";
        $scope.newComment = "";
        $scope.middle_page1 = 2, $scope.middle_page2 = 3, $scope.middle_page3 = 4;        
        
        var deleteIndex = "";
        var isSearchResultsView = false;

        var COMMENT_LIST_SCROLL = 'comment-list-scroll';

        var setCommentScrollHeight = function() {
            var postEl = angular.element(document.querySelectorAll(".activity-post"))[$scope.$index];
            var conversationWrapper = angular.element(postEl.querySelector(".conversation-wrapper"))[0];
            var commentScroll = angular.element(postEl.querySelector(".neighbours-comment-scroll"))[0];
            var commentContainer = angular.element(postEl.querySelector(".neighbours-comment-container"))[0];

            var comments = commentContainer.children;
            var height = 75 * comments.length ;

            height = height < 200 && height > 0 ? height + 20 : height;
            _.each(comments, function(comment) {
                
                if (comment.clientHeight > 70)
                    height += comment.clientHeight - 70;
            });
            var wrapperHeight;

            if (height < 300) {
                wrapperHeight = height;
                commentScroll.style.height = "" + height + "px";
                conversationWrapper.style.height = "" + height + "px";
            } else {
                wrapperHeight = 300;
                commentScroll.style.height = "300px";
                conversationWrapper.style.height = "300px";
            }
            
            commentContainer.style.height = "" + height + "px";

            var parentPostEl =  angular.element(postEl.querySelector(".post-full"))[0];
            var parentPostElHeight = parentPostEl.clientHeight - 20;
            var updatedHeight = wrapperHeight + 60 + parentPostElHeight;
            var commentScrollData = {};

            commentScrollData.index = $scope.$index;
            commentScrollData.height = updatedHeight;
            commentScrollData.isSearchResultsView = isSearchResultsView;
            $scope.$emit("socialLobbyHeightUpdated", commentScrollData);
        };

        var refreshCommentScroll = function() {
            
            setTimeout(function() {
                setCommentScrollHeight();
                $scope.refreshScroller(COMMENT_LIST_SCROLL);
                if ( $scope.myScroll.hasOwnProperty(COMMENT_LIST_SCROLL) ) {
                    $scope.myScroll[COMMENT_LIST_SCROLL].scrollTo(0, 0, 100);
                }
                $scope.$apply();

            }, 500);
            
        };

        var setCommentScroller = function() {
            var scrollerOptions = {
                tap: true,
                preventDefault: false
            };

            
            $scope.setScroller(COMMENT_LIST_SCROLL, scrollerOptions);
        };

        setCommentScroller();

        $scope.fetchComments = function() {
            var options = {};

            options.params = $scope.commentParams;
            $scope.$emit("SL_ERROR", "");
            options.onSuccess = function(data) {
                
                $scope.comments = data.results.comments;
                $scope.totalCommentPages = data.results.total_count % $scope.commentParams.per_page > 0 ? Math.floor(data.results.total_count / $scope.commentParams.per_page) + 1 : Math.floor(data.results.total_count / $scope.commentParams.per_page);
                $scope.$emit('hideLoader');
                isSearchResultsView = false;
                refreshCommentScroll();
            };
            options.failureCallBack = function(error) {

                $scope.$emit("SL_ERROR", error);
            };
            $scope.callAPI(RVSocilaLobbySrv.fetchComments, options);
        };

        var commentsViewUpdateOnSearch = function() {
            $scope.comments = $scope.parentPost.comments;
            $scope.totalCommentPages = 1;
            isSearchResultsView = true;
            refreshCommentScroll();
        };

        if ($scope.parentPost.comments.length == 0 || !$scope.parentPost.isSearchResults) {
            $scope.fetchComments();
        } else {
            commentsViewUpdateOnSearch();
            $scope.$on("ExpandComments", function(event, data) {
                if (data.post_id == $scope.parentPost.id) {
                    $scope.fetchComments();
                }                    
            });
            $scope.$on("SL_SEARCH_UPDATED", function(event, data) {
                if (data.post_id == $scope.parentPost.id) {
                    commentsViewUpdateOnSearch();
                }
                    
            });
            

        }        

        $scope.refreshComments = function() {
            $scope.commentParams.page = 1;
            $scope.middle_page1 = 2, $scope.middle_page2 = 3, $scope.middle_page3 = 4;
            $scope.newComment = "";
            $scope.fetchComments();
        };

        $scope.addComment = function() {
            $scope.$emit("SL_ERROR", "");
            var options = {};

            options.params = {
                "comment": {
                "comment_title": "",
                "comment_text": $scope.newComment
            }};
            options.params.post_id = $scope.parentPost.id;
            options.onSuccess = function() {
                $scope.parentPost.comment_count ++;
                $scope.refreshComments();
            };
            options.failureCallBack = function(error) {

                $scope.$emit("SL_ERROR", error);
            };
            $scope.callAPI(RVSocilaLobbySrv.addComment, options);
        };

        $scope.deleteCommentClicked = function(comment_id) {
            deleteIndex = comment_id;
            ngDialog.open({
                   template: '/assets/partials/socialLobby/rvSLPostDelete.html',
                   className: 'ngdialog-theme-default single-calendar-modal',
                   scope: $scope,
                   closeByDocument: true});
        };
        
        $scope.delete = function() {
            $scope.$emit("SL_ERROR", "");
            var options = {};

            options.params = {'comment_id': deleteIndex};
            options.onSuccess = function() {
                $scope.parentPost.comment_count --;
                $scope.refreshComments();
                ngDialog.close();
            };
            options.failureCallBack = function(error) {

                $scope.$emit("SL_ERROR", error);
                ngDialog.close();
            };
            $scope.callAPI(RVSocilaLobbySrv.deleteComment, options);
        };

        $scope.paginateComments = function(page) {
            $scope.$emit("SL_ERROR", "");
            if (page == $scope.commentParams.page)
                return;
            $scope.commentParams.page = page;
            $scope.fetchComments();
            if ($scope.commentParams.page > $scope.middle_page3 && $scope.commentParams.page < $scope.totalCommentPages) {
                $scope.middle_page3++;
                $scope.middle_page2++;
                $scope.middle_page1++;
            } else if ($scope.commentParams.page < $scope.middle_page1 && $scope.commentParams.page > 1) {
                $scope.middle_page3--;
                $scope.middle_page2--;
                $scope.middle_page1--;
            } else if ($scope.commentParams.page == 1) {
                $scope.middle_page3 = 4;
                $scope.middle_page2 = 3;
                $scope.middle_page1 = 2;
            } else if ($scope.commentParams.page == $scope.totalCommentPages && $scope.totalCommentPages > 5) {
                $scope.middle_page3 = $scope.totalCommentPages - 1;
                $scope.middle_page2 = $scope.totalCommentPages - 2;
                $scope.middle_page1 = $scope.totalCommentPages - 3;
            }
        };        

    }

]);
