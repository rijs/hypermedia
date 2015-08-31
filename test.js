var expect = require('chai').expect
  , core = require('rijs.core')
  , data = require('rijs.data')
  , hypermedia = require('./')
  , keys = require('utilise/keys')
  , http = auth() 

describe('Hypermedia API', function() {
  this.timeout(10000)

  it('should load root resource', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http })
    ripple('github').once('change', function(github){
      expect(keys(github).length).to.be.gt(10)
      done()
    })
  })

  it('should load and cache intermediate links', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http })
    ripple('github.current_user_url.id').on('change', function(user){
      if (!user.value) return 
      expect('github' in ripple.resources).to.be.ok
      expect('github.current_user_url' in ripple.resources).to.be.ok
      expect('github.current_user_url.id' in ripple.resources).to.be.ok
      expect(user.value).to.be.equal(2184177)
      done()
    })
  })

  it('should work with arrays', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http })
    ripple('github.current_user_url.repos_url.0').on('change', function(repo){
      if (!repo.name) return
      expect(repo.name).to.eql('browser-repl')
      done()
    })
  })

  it('should traverse deep simple keys too', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http })
    ripple('github.current_user_url.repos_url.0.owner.login').on('change', function(login){
      if (!login.value) return
      expect(login.value).to.eql('pemrouz')
      done()
    })
  })

  // it('should alias from link', function(done){  
  //   var ripple = hypermedia(data(core()))
  //   ripple('github', 'https://api.github.com', http)
  //   ripple('repos', 'github.current_user_url.repos_url.0')
  //     .on('change', function(d){
  //       console.log('changed', d)
  //     })

  //   console.log('listener registered', ripple.resources['github.current_user_url.repos_url.0'].body.on.change.length)

  //   // setTimeout(function(){
  //   //   expect(ripple('github.current_user_url.repos_url.0').name).to.eql('browser-repl')
  //   //   done()
  //   // }, 5000)
  // })

})


function auth(){
  return { Authorization: 'Basic ' + new Buffer(process.env.GITHUB_USERNAME + ":" + process.env.GITHUB_PASSWORD).toString('base64') }
}