module.exports = function(req) {
    return {
        title: '건전성 테스트 불합격 팀블로그',
        user: req.user,
        isMobile: req.useragent.isMobile
    }
}
