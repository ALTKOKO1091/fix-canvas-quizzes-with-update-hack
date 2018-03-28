const puppeteer = require('puppeteer')
const util = require('util')
const prompt = require('prompt')

function getQuizzes(courseId){
  return Promise.all()
}

async function clickIt(courseId,quizId){
  console.log(courseId,quizId)
}

const USERNAME_FIELD = '#pseudonym_session_unique_id'
const PASSWORD_FIELD = '#pseudonym_session_password'
const LOGIN_BUTTON = '#login_form .Button--login'

const QUESTION_TAB = '[aria-controls=questions_tab]'
const QUESTION_TAB_IS_SELECTED = '[aria-controls=questions_tab][aria-selected=true]'

const SAVE_CHANGES = '.save_quiz_button'
const EDIT_QUESTION = '#questions .edit_question_link'
const UPDATE_QUESTION = '#questions .submit_button'
const QUESTION_IS_DISPLAYED = () => document.querySelector('#questions .display_question').style.display != "none"

async function promptCreds(){
  prompt.start()
  return await util.promisify(prompt.get)(['username',{
    name:'password',
    hidden:true,
    replace:'*'
  }])
}

async function login(page){
  let auth = await promptCreds()
  await page.goto('https://byui.instructure.com/login/canvas')
  await page.type(USERNAME_FIELD,auth.username)
  await page.type(PASSWORD_FIELD,auth.password)
  await Promise.all([
    page.waitForNavigation(),
    page.click(LOGIN_BUTTON,'#login_form .Button--login')
  ])
  var currentPath = await page.evaluate('window.location.pathname')
  if(currentPath == '/login/canvas'){
    await login(page)
  }
}

async function findBadQuizzes(page,courseId){
  await page.goto(`https://byui.instructure.com/courses/${courseId}/quizzes`)
  return page.evaluate(courseId => {
    return new Promise((resolve,reject) => {
      let links = $('.quiz a.ig-title').get().map(n => n.href.match(/\d+$/)[0]), numDone = 0, errored = []
      links.forEach((id,i) => {
        $.ajax(`/api/v1/courses/${courseId}/quizzes/${id}/questions`)
          .done(() => {
            if(++numDone == links.length) resolve(errored)
          })
          .error(() => {
            errored.push(id)
            if(++numDone == links.length) resolve(errored)
          })
      })
    })
  },courseId)
}

async function clickIt(page,courseId,quizId){
  await page.goto(`https://byui.instructure.com/courses/${courseId}/quizzes/${quizId}/edit`)
  // Click the Questions tab
  await Promise.all([
    page.waitFor(QUESTION_TAB_IS_SELECTED),
    page.click(QUESTION_TAB)
  ])
  // Click the edit buttons
  await Promise.all([
    page.waitFor(UPDATE_QUESTION),
    page.evaluate(`$('${EDIT_QUESTION}').click()`)
  ])
  // Click the 'Update Question' buttons
  await Promise.all([
    page.waitFor(QUESTION_IS_DISPLAYED),
    page.evaluate(`$('${UPDATE_QUESTION}').click()`)
  ])
  // Click Save
  await Promise.all([
    page.waitForNavigation(),
    page.click(SAVE_CHANGES)
  ])
}

async function fixQuizzes(page,courseId){
  let errorQuizIds = await findBadQuizzes(page,courseId)
  console.log(`found ${errorQuizIds.length} bad quizzes in ${courseId}`)
  
  for(var i = 0; i < errorQuizIds.length; i++){
    console.log(`fixing ${String(i+1).padStart(2)} of ${String(errorQuizIds.length).padEnd(2)} [quizid:${errorQuizIds[i]},courseid:${courseId}]`)
    await clickIt(page,courseId,errorQuizIds[i])
  }

  console.log('\ndouble checking our work...')
  errorQuizIds = await findBadQuizzes(page,courseId)
  console.log(`\n${errorQuizIds.length} quizzes still have errors ${errorQuizIds} in ${courseId}`)
}

async function main(){
  let result = await util.promisify(prompt.get)(['courses'])
  let courses = result.courses.match(/\d+/g)

  let browser = await puppeteer.launch({headless:true})
  let page = await browser.newPage()
  
  await login(page)
  
  for(var i = 0; i < courses.length; i++){
    await fixQuizzes(page,courses[i])
  }

  await browser.close()
}

main().catch(console.error)