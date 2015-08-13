module.exports = function(req) {
    return {
        user: req.user,
        isMobile: req.useragent.isMobile
    }
}
