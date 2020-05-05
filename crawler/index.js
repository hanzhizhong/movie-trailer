const cheerio = require('cheerio')
const axios = require('axios')
const _Url = require('url')
const baseUrl = 'https://movie.douban.com'
//搜索地址https://movie.douban.com/j/subject_suggest?q=


async function getMovieId(url) {
    let aMovieId = []
    try {
        let ret = await axios.get(url)
        if (ret.status === 200) {
            let $ = cheerio.load(ret.data, { decodeEntities: false })
            $('.indent table').each((index, item) => {
                aMovieId.push($(item).find('a[class=nbg]').attr('href'))
            })
        }
        return aMovieId
    } catch (err) {
        console.log('error', '请求地址获取数据失败')
    }
}

//遍历获取的地址，获取详细信息后存入数据库
async function saveDate2Database(url) {
    let arr = await getMovieId(url)
    for (let temp of arr) {
        let info = await getDetailInfo(temp)
    }
}

async function getDetailInfo(url) {
    let info = {}
    //排行榜的首页
    let ret = await getResultByUrl(url)
    let $ = cheerio.load(ret, { decodeEntities: false })
    let $h1 = $('#content').find('h1 span')
    //电影的标题
    info.year = Number($h1.eq(1).html().replace(/[\(\)]/gi, ''));
    let title = $h1.eq(0).html().match(/(\S+)+/gi);
    info.title = title[0]
    title.splice(0, 1)
    info.origin_title = title.join(' ')

    //电影的海报页面主要信息
    let postUrl = $('#mainpic').find('a').attr('href')//海报地址
    info.aImageList = await getCoverInfo(postUrl)

    //获取导演的信息页面
    let directorsUrl = [];
    info.directors = [];
    let director = {}
    let $info = $('#info')
    $info.find('span').find('span[class=attrs]').eq(0).find('a').each((index, item) => {
        directorsUrl.push($(item).attr('href'))
    });
    for (let temp of directorsUrl) {
        let tempUrl = baseUrl + temp;
        let _directorInfo = await getPersonInfo(tempUrl)
        director.name = _directorInfo.name;
        director.name_en = _directorInfo.name_en;
        director.avatar = _directorInfo.avatar;
        director.alt = _directorInfo.alt;
        director.id = _directorInfo.id
        info.directors.push(director)
    }
    //编剧信息
    let writersUrl = [];
    info.writers = [];
    let writer = {}
    $info.find('span').find('span[class=attrs]').eq(1).find('a').each((index, item) => {
        writersUrl.push($(item).attr('href'))
    })
    for (let temp of writersUrl) {
        let tempUrl = baseUrl + temp;
        let _writerInfo = await getPersonInfo(tempUrl)
        writer.name = _writerInfo.name;
        writer.name_en = _writerInfo.name_en;
        writer.avatar = _writerInfo.avatar;
        writer.alt = _writerInfo.alt;
        writer.id = _writerInfo.id
        console.log('ssssssss',writer)
        info.writers.push(writer)
    }

    //console.log('info', info)
}
//海报页面信息爬取
async function getCoverInfo(url) {
    let aImageList = []
    let imgDom = await getResultByUrl(url)
    let $ = cheerio.load(imgDom, { decodeEntities: false });
    let $cover = $('.article').find('.cover')
    $cover.each((index, item) => {
        aImageList.push($(item).find('img').attr('src'))
    })
    return aImageList;
}
//获取导演的信息页面
async function getPersonInfo(url) {
    let _content = await getResultByUrl(url)
    let re=/\d+/gi
    let _id='';
    let _pathname=_Url.parse(url).pathname
    if(!re.test(_pathname)) return;
    _id = _pathname.match(re)[0];
    let $ = cheerio.load(_content, { decodeEntities: false });
    if (!$('#content')) return;
    let _personName = $('#content').find('h1').html()
    if(!_personName) return {};
    let _result = _personName.match(/\S+/gi)
    let _avatar = $('#headline .pic').find('img').attr('src')
    return {
        name: _result[0],
        name_en: _result.slice(1).join(' '),
        avatar: _avatar,
        alt: url,
        id: _id
    }
}

//获取编剧的信息
async function getResultByUrl(url) {
    try {
        let ret = await axios.get(url)
        if (ret.status == 200) {
            return ret.data;
        }
    } catch (err) {
        console.log('根据网络地址获取数据失败了', err)
    }
}

saveDate2Database(`${baseUrl}/chart`)