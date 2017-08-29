/**
 * 页面请求控制类
 * Created by Jade.zhu on 2016/06/13.
 */
var router = require('express').Router();
var async = require('async');
var request = require('request');
var constant = require('../../constant/constant');
var config = require('../../resources/config');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
var adminService = require('../../service/adminService.js');
var studioService = require('../../service/studioService');
var userService = require('../../service/userService');
var baseApiService = require('../../service/baseApiService.js');
var messageService = require('../../service/messageService');
var chatService = require('../../service/chatService');
var syllabusService = require('../../service/syllabusService');
var visitorService = require('../../service/visitorService');
var zxFinanceService = require('../../service/zxFinanceService');
var logger = require('../../resources/logConf').getLogger('admin');
var versionUtil = require('../../util/versionUtil');

/**
 * 聊天室后台页面入口
 */
router.get('/', function(req, res) {
    var isNw = req.query['nw'];
    var viewDataObj = { isLogin: false };
    viewDataObj.isNw = isNw ? isNw : false;
    viewDataObj.isDevTest = config.isDevTest;
    var adminUserInfo = req.session ? req.session.adminUserInfo : null;
    if (adminUserInfo) {
        var userId = adminUserInfo.userId;
        viewDataObj.teacher = adminUserInfo;
        async.parallel({
                chartGroup: function(callback) {
                    adminService.getChatGroupListByAuthUser(userId, function(result) {
                        callback(null, result);
                    });
                },
                getRooms: function(callback) {
                    adminService.getChatGroupRoomsList(function(result) {
                        callback(null, result);
                    });
                }
            },
            function(err, results) {
                if (results.chartGroup) {
                    viewDataObj.rooms = results.chartGroup;
                }
                if (results.getRooms) {
                    viewDataObj.chatGroup = results.getRooms;
                }
                viewDataObj.isLogin = true;
                res.render(global.rootdir + '/template/admin/view/index', viewDataObj);
            });
    } else {
        res.render(global.rootdir + '/template/admin/view/index', viewDataObj);
    }
});

/**
 * 聊天室房间
 */
router.get('/room', function(req, res) {
    var isNw = req.query['nw'];
    var groupId = req.query['groupId'];
    var groupType = req.query['groupType'];
    var roomName = req.query['roomName'];
    var adminUserInfo = req.session.adminUserInfo;
    var viewDataObj = { apiUrl: common.formatHostUrl(req.hostname, config.apiUrl), filePath: common.formatHostUrl(req.hostname, config.filesDomain) };
    viewDataObj.isNw = isNw ? isNw : false;
    viewDataObj.roomName = roomName;
    viewDataObj.version = versionUtil.getVersion();
    viewDataObj.isDevTest = config.isDevTest;
    if (adminUserInfo) {
        var userInfo = {};
        common.copyObject(userInfo, adminUserInfo, true);
        userInfo.groupId = groupId;
        userInfo.groupType = groupType;
        userInfo.sid = req.sessionID;
        async.parallel({
                checkResult: function(callback) {
                    userService.checkSystemUserInfo(userInfo, function(result) {
                        callback(null, result);
                    });
                },
                getGroup: function(callback) {
                    studioService.getStudioByGroupId(groupId, function(result) {
                        callback(null, result);
                    });
                }
            },
            function(err, results) {
                if (results.checkResult != null && !results.checkResult.isOK) {
                    res.render('error', errorMessage.code_12);
                } else {
                    if (results.checkResult != null) {
                        viewDataObj.userInfo = JSON.stringify(userInfo);
                        viewDataObj.groupId = groupId;
                        viewDataObj.groupType = groupType;
                    }
                    if (results.getGroup) {
                        viewDataObj.groupInfo = results.getGroup;
                        viewDataObj.groupInfo.allowWhisper = common.containSplitStr(viewDataObj.groupInfo.talkStyle, 1);
                    }
                    viewDataObj.nickname = userInfo.nickname;
                    viewDataObj.userType = userInfo.userType;
                    viewDataObj.socketUrl = JSON.stringify(common.formatHostUrl(req.hostname, config.socketServerUrl));
                    viewDataObj.msgCenter = JSON.stringify(config.msgCenter);
                    viewDataObj.isDevTest = config.isDevTest;
                    viewDataObj.companyId = config.companyId;
                    viewDataObj.gwAnalysisServer = config.gwAnalysisServer || null;
                    res.render(global.rootdir + '/template/admin/view/room', viewDataObj);
                }
            });
    } else {
        res.render('error', errorMessage.code_11);
    }
});

/**
 * 添加文章/老师观点
 */
router.post('/addArticle', function(req, res) {
    var adminUserInfo = req.session.adminUserInfo;
    if (adminUserInfo) {
        var data = req.body['data'];
        var isNotice = req.body['isNotice'] == "Y";
        if (common.isBlank(data)) {
            res.json({ isOK: false, msg: '参数错误' });
        } else {
            baseApiService.addArticle(data, function(result) {
                if (result && result.data) {
                    result = result.data;
                }
                if (result && result.isOK) {
                    var dataObj = JSON.parse(data);
                    dataObj.id = result.id;
                    dataObj.createDate = result.createDate;
                    var bDateTime = new Date(dataObj.publishStartDate).getTime();
                    var eDateTime = new Date(dataObj.publishEndDate).getTime();
                    var currTime = new Date().getTime();
                    if (isNotice || (currTime >= bDateTime && currTime <= eDateTime)) {
                        chatService.sendNoticeArticle(dataObj.platform, dataObj);
                    }
                    res.json(result);
                } else {
                    //logger.error("addArticle->fail:"+e);
                    res.json({ isOK: false, msg: '添加失败' });
                }
            });
        }
    } else {
        res.render('error', { error: '您未登录，请登录后访问' });
    }
});
/**
 * 聊天室登录页
 */
router.post('/login', function(req, res) {
    var userId = req.body['userId'];
    var password = req.body['password'];
    if (common.isBlank(userId)) {
        res.json({ isOK: false, msg: '用户名不能为空' });
    } else if (common.isBlank(password)) {
        res.json({ isOK: false, msg: '登录密码不能为空' });
    } else {
        password = common.getMD5(constant.md5Key + password);
        adminService.checkSystemUserInfo(userId, password, function(result) {
            if (result.isOK) {
                req.session.adminUserInfo = result;
                req.session.adminUserInfo.sid = req.sessionID;
                res.json({ isOK: true, msg: '' });
            } else {
                res.json({ isOK: false, msg: '用户名或密码错误' });
            }
        });
    }
});

/**
 * 登出聊天室，使用ajax方式退出
 */
router.get('/logout', function(req, res) {
    var isNw = req.query['nw'];
    req.session.adminUserInfo = null;
    res.json({ isOK: true, isNw: isNw });
});

/**
 * 设置禁言
 */
router.post('/setUserGag', function(req, res) {
    var data = req.body['data'];
    var isVisitor = req.body['isvisitor'];
    if (common.isBlank(data)) {
        res.json({ isOK: false, msg: '提交数据有误' });
    } else {
        if (typeof data == 'string') {
            data = JSON.parse(data);
        }
        if (isVisitor == 'true') {
            adminService.setVisitorGag(data, function(result) {
                if (result) {
                    if (result.isOk) {
                        res.json({ isOK: true, msg: '' });
                    } else if (result.isIn) {
                        res.json({ isOK: false, msg: '禁言列表已存在该用户' });
                    } else {
                        res.json({ isOK: false, msg: result.msg });
                    }
                }
            });
        } else {
            adminService.setUserGag(data, function(result) {
                if (result) {
                    res.json({ isOK: true, msg: '' });
                } else {
                    res.json({ isOK: false, msg: result.msg });
                }
            });
        }
    }
});

/**
 * 获取已设置禁言的数据
 */
router.post('/getUserGag', function(req, res) {
    var data = req.body['data'];
    if (typeof data == 'string') {
        data = JSON.parse(data);
    }
    adminService.getUserGag(data, function(result) {
        if (result) {
            res.json(result);
        } else {
            res.json(null);
        }
    });
});

/**
 * 删除聊天记录
 */
router.post('/removeMsg', function(req, res) {
    var data = req.body['data'];
    if (typeof data == 'string') {
        data = JSON.parse(data);
    }
    if (!data.publishTimeArr) {
        res.json(null);
    } else {
        messageService.deleteMsg(data, function(result) {
            if (result) {
                chatService.removeMsg(data.groupId, data.publishTimeArr.join(","));
                res.json({ isOK: result });
            } else {
                res.json(null);
            }
        });
    }
});

/**
 * 更新文章/老师观点
 */
router.post('/modifyArticle', function(req, res) {
    var adminUserInfo = req.session.adminUserInfo;
    if (adminUserInfo) {
        var where = req.body['where'];
        var data = req.body['data'];
        if (common.isBlank(where) || common.isBlank(data)) {
            res.json({ isOK: false, msg: '参数错误' });
        }
        if (typeof where == 'string') {
            where = JSON.parse(where);
        }
        if (typeof data == 'string') {
            data = JSON.parse(data);
        }
        var searchObj = { _id: where._id, detailList: { $elemMatch: { lang: where.lang } } };
        var field = "publishStartDate publishEndDate detailList.$";
        var updater = {
            '$set': {
                'publishStartDate': data.publishStartDate,
                'publishEndDate': data.publishEndDate,
                'detailList.$.title': data.title,
                'detailList.$.content': data.content
            }
        };
        baseApiService.modifyArticle(searchObj, field, updater, function(result) {
            if (result) {
                res.json(result);
            } else {
                //logger.error("addArticle->fail:"+e);
                res.json({ isOK: false, msg: '更新失败' });
            }
        });
    } else {
        res.render('error', { error: '您未登录，请登录后访问' });
    }
});

/**
 * 获取最近两天聊天记录
 */
router.post('/getLastTwoDaysMsg', function(req, res) {
    var params = req.body['data'];
    if (typeof params == 'string') {
        try {
            params = JSON.parse(params);
        } catch (e) {
            res.json(null);
            return;
        }
    }
    if (common.isBlank(params.groupType) || common.isBlank(params.groupId) || common.isBlank(params.userId)) {
        res.json(null);
    } else {
        messageService.getLastTwoDaysMsg(params, function(result) {
            res.json(result);
        });
    }
});

router.get('/getSyllabus', (req, res) => {
    let groupType = req.query["groupType"] || "";
    let groupId = req.query["groupId"] || "";
    syllabusService.getSyllabus(groupType, groupId).then(result => {
        res.json(result);
    }).catch(e => {
        logger.warn("getSyllabus error: ", e);
        res.json(null);
    });
});

router.get('/getVistiorByName', (req, res) => {
    let groupType = req.query["groupType"] || "";
    let groupId = req.query["groupId"] || "";
    let nickname = req.query["nickname"] || "";

    visitorService.getVistiorByName({
        groupType: groupType,
        groupId: groupId,
        nickname: nickname
    }).then(result => {
        res.json(result);
    }).catch(e => {
        logger.warn("getSyllabus error: ", e);
        res.json(null);
    });
});

/**
 * 加载大图数据
 */
router.get('/getBigImg', function(req, res) {
    var publishTime = req.query["publishTime"],
        userId = req.query["userId"];
    if (common.isBlank(publishTime)) {
        res.end("");
    } else {
        messageService.loadBigImg(userId, publishTime, function(bigImgData) {
            if (common.isBlank(bigImgData)) {
                res.end("");
            } else {
                res.writeHead(200, { "Content-Type": "image/jpeg" });
                res.end(new Buffer(bigImgData.replace(/^data:image.*base64,/, ""), 'base64'));
            }
        });
    }
});
/**
 * 上传数据
 */
router.post('/uploadData', function(req, res) {
    var data = req.body;
    if (data != null && process.platform.indexOf("win") == -1) {
        //创建异常监控
        var domain = require('domain').create();
        domain.on('error', function(er) {
            logger.error("uploadImg fail,please check it", er);
            res.json({ success: false });
        });
        domain.run(function() {
            //执行进程监控
            process.nextTick(function() {
                var imgUtil = require('../../util/imgUtil'); //引入imgUtil
                var val = data.content.value,
                    needMax = data.content.needMax;
                if (data.content.msgType == "img" && common.isValid(val)) {
                    imgUtil.zipImg(val, 100, 60, function(minResult) {
                        if (minResult.isOK) {
                            data.content.value = minResult.data;
                            if (needMax == 1) {
                                imgUtil.zipImg(val, 0, 60, function(maxResult) {
                                    if (maxResult.isOK) {
                                        data.content.maxValue = maxResult.data;
                                        chatService.acceptMsg(data, null);
                                    }
                                    res.json({ success: maxResult.isOK });
                                });
                            } else {
                                chatService.acceptMsg(data, null);
                                res.json({ success: minResult.isOK });
                            }
                        } else {
                            res.json({ success: minResult.isOK });
                        }
                    });
                } else {
                    res.json({ success: false });
                }
            });
        });
    } else {
        logger.warn("warn:please upload img by linux server!");
        res.json({ success: false });
    }
});

/**
 * 提取文档信息
 *
 */
router.get('/getArticleList', function(req, res) {
    var params = {},
        userInfo = req.session.studioUserInfo;
    params.code = req.query["code"];
    params.platform = req.query["platform"];
    params.pageNo = req.query["pageNo"];
    params.isAll = req.query["isAll"] || "";
    params.pageKey = req.query["pageKey"] || "";
    params.pageLess = req.query["pageLess"] || "";
    params.authorId = req.query["authorId"];
    params.pageSize = req.query["pageSize"];
    params.hasContent = req.query["hasContent"];
    params.orderByStr = req.query["orderByStr"];
    params.pageNo = common.isBlank(params.pageNo) ? 1 : params.pageNo;
    params.pageSize = common.isBlank(params.pageSize) ? 15 : params.pageSize;
    params.orderByStr = common.isBlank(params.orderByStr) ? "" : params.orderByStr;
    var ids = req.query['ids'] || '';
    var callTradeIsNotAuth = 0,
        strategyIsNotAuth = 0;
    if (params.code == 'class_note') {
        callTradeIsNotAuth = req.query['callTradeIsNotAuth'] || 0;
        strategyIsNotAuth = req.query['strategyIsNotAuth'] || 0;
    }
    baseApiService.getArticleList(params, function(data) {
        if (data) {
            data = typeof data === 'string' ? JSON.parse(data) : data;
            if (params.code == 'class_note') {
                var dataList = data.data,
                    row = null;
                for (var i in dataList) {
                    row = dataList[i];
                    var detailInfo = row.detailList && row.detailList[0];
                    if (!common.containSplitStr(ids, row._id)) {
                        if ((detailInfo.tag == 'shout_single' || detailInfo.tag == 'trading_strategy' || detailInfo.tag == 'resting_order')) {
                            var remark = JSON.parse(detailInfo.remark),
                                remarkRow = null;
                            for (var j in remark) {
                                remarkRow = remark[j];
                                if (strategyIsNotAuth == 1) {
                                    remarkRow.open = '****';
                                    remarkRow.profit = '****';
                                    remarkRow.loss = '****';
                                    remarkRow.description = '****';
                                }
                                remark[j] = remarkRow;
                            }
                            detailInfo.remark = JSON.stringify(remark);
                        }
                        row.detailList[0] = detailInfo;
                        dataList[i] = row;
                    }
                }
                data.data = dataList;
            }
            res.json(data);
        } else {
            res.json(null);
        }
    });
});

router.get('/getRoomOnlineList', function(req, res) {
    let params = req.query;
    // chatService.getRoomOnlineList(params)
    //     .then(data => {
    //         res.json(data);
    //     }).catch(e => {
    //         logger.error("getRoomOnlineList Error:", e);
    //         res.json(null);
    //     });
    chatService.getTopicOnlineList(params)
        .then(result => {
            if (!result.data && result.data.data) {
                throw new Error("Response Data result format Error!");
            }
            let list = result.data.data.map(item => JSON.parse(item.ext || ""));
            res.json(list);
        })
        .catch(e => {
            logger.error("getRoomOnlineList Error:", e);
            res.json(null);
        })
});

router.get('/loadMsg', function(req, res) {
    let params = req.query;
    messageService.loadMsg(params)
        .then(data => {
            res.json(data);
        }).catch(e => {
            logger.error("loadMsg Error:", e);
            res.json(null);
        });
});

/**
 * 保存财经数据点评内容
 */
router.post('/saveFinanceDataReview', function(req, res) {
    let data = req.body['data'],
        params = {};
    let adminUserInfo = req.session.adminUserInfo;
    if (typeof data == 'string') {
        try {
            params = JSON.parse(data);
        } catch (e) {
            res.json({ isOK: false, msg: '参数错误' });
            return;
        }
    }
    if (common.isBlank(params.comment) || common.isBlank(params.bid) || common.isBlank(params.name) || common.isBlank(params.date)) {
        res.json({ isOK: false, msg: '参数值为空' });
        return;
    }
    params.userId = params.userId || adminUserInfo.userId;
    params.userName = params.userName || adminUserInfo.nickname;
    params.avatar = params.avatar || adminUserInfo.avatar;
    params.ip = common.getClientIp(req);
    zxFinanceService.saveFinanceDataReview(params, function(result) {
        res.json(result);
    });
});

router.get('/getWhMsgList', function(req, res) {
    let adminUserInfo = req.session.adminUserInfo;
    var paramObj = {
        type: constant.message.type.PERSONAL,
        systemCategory: config.companyId,
        relation: `${adminUserInfo.userId},${req.query.userId}`
    };
    messageService.getWhMsgList(paramObj)
        .then(result => {
            res.json(result);
        }).catch(e => {
            logger.error(e);
            res.json(errorMessage.code_10);
        });
});

module.exports = router;