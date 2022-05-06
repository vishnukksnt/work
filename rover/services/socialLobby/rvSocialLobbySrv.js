angular.module('sntRover').service('RVSocilaLobbySrv',
    ['$http', '$q', 'BaseWebSrvV2', 'RVBaseWebSrv',
    function($http, $q, BaseWebSrvV2, RVBaseWebSrv) {

        this.fetchPosts = function(params) {
        var deferred = $q.defer();
        var url = 'api/social_lobby.json';

            BaseWebSrvV2.getJSON(url, params).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.fetchComments = function(params) {
        var deferred = $q.defer();
        var url = 'api/social_lobby/' + params.post_id + '/comments.json';

            BaseWebSrvV2.getJSON(url, params).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.search = function(params) {
        var deferred = $q.defer();
        var url = 'api/social_lobby/search.json';

            BaseWebSrvV2.getJSON(url, params).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.addPost = function(data) {
        var deferred = $q.defer();
        var url = 'api/social_lobby.json';

            BaseWebSrvV2.postJSON(url, data).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.addComment = function(data) {
        var deferred = $q.defer();
        var url = 'api/social_lobby/' + data.post_id + '/create_comment.json';

            BaseWebSrvV2.postJSON(url, data).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.deletePost = function(data) {
        var deferred = $q.defer();
        var url = 'api/social_lobby/' + data.post_id;

            BaseWebSrvV2.deleteJSON(url).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };

    this.deleteComment = function(data) {
        var deferred = $q.defer();
        var url = 'api/social_lobby/' + data.comment_id + '/destory_comment.json';

            BaseWebSrvV2.deleteJSON(url).then(function(data) {

                 deferred.resolve(data);
            }, function(data) {
                deferred.reject(data);
            });

        return deferred.promise;
    };
    

}]);