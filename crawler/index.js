const cheerio=require('cheerio')
const axios=require('axios')

const baseUrl='https://movie.douban.com'
//搜索地址https://movie.douban.com/j/subject_suggest?q=


async function getMovieId(url){
    let aMovieId=[]
    try{
        let ret=await axios.get(url)
        if(ret.status===200){
            let $=cheerio.load(ret.data,{decodeEntities:false})
            $('.indent table').each((index,item)=>{
                aMovieId.push($(item).find('a[class=nbg]').attr('href'))
            })
        }
        return aMovieId
    }catch(err){
        console.log('error','请求地址获取数据失败')
    }
}

//遍历获取的地址，获取详细信息后存入数据库
async function saveDate2Database(url){
    let arr=await getMovieId(url)
    for(let temp of arr){
        console.log('temp',temp)
        let info=await getDetailInfo(temp)
    }
}

async function getDetailInfo(url){
    let info={}
    try{
        let ret=await axios.get(url)
        if(ret.status===200){
            let $=cheerio.load(ret.data,{decodeEntities:false})
            let span=$('#content').find('h1 span')
            
            console.log('tttt',span.eq(0).html(),span.eq(1).html())
            info.year=Number(span.eq(1).html().replace(/[\(\)]/gi,''));
            let title=span.eq(0).html().match(/(\S+)+/gi);
            info.title=title[0]
            title.splice(0,1)
            info.origin_title=title.join(' ')
            console.log('info',info)
        }
    }catch(err){
        console.log('error',`请求地址获取数据失败${err}`)
    }
}
saveDate2Database(`${baseUrl}/chart`)