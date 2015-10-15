var expect = require('chai').expect
  , core = require('rijs.core')
  , data = require('rijs.data')
  , hypermedia = require('./')
  , keys = require('utilise/keys')
  , time = require('utilise/time')
  , http = auth()

describe('Hypermedia API', function() {
  this.timeout(10000)

  it('should load root resource', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http: http })
    ripple('github').once('change', function(github){
      expect(keys(github).length).to.be.gt(10)
      done()
    })
  })

  it('should follow links', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http: http })
    ripple('github.current_user_url').on('change', function(user){
      if (!user.login) return 
      expect('github' in ripple.resources).to.be.ok
      expect('github.current_user_url' in ripple.resources).to.be.ok
      expect(user.login).to.be.equal('OGLES')
      done()
    })
  })

  it('should load and cache intermediate links', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http: http })
    ripple('github.current_user_url.id').on('change', function(user){
      if (!user.value) return 
      expect('github' in ripple.resources).to.be.ok
      expect('github.current_user_url' in ripple.resources).to.be.ok
      expect('github.current_user_url.id' in ripple.resources).to.be.ok
      expect(user.value).to.be.equal(231825)
      done()
    })
  })

  it('should work with arrays', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http: http })
    ripple('github.current_user_url.repos_url.0').on('change', function(repo){
      if (!repo.name) return
      expect(repo.name).to.eql('builder')
      done()
    })
  })

  it('should traverse deep simple keys too', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com', { http: http })
    ripple('github.current_user_url.repos_url.0.owner.login').on('change', function(login){
      if (!login.value) return
      expect(login.value).to.eql('OGLES')
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

  it('should use cached resource if available', function(done){  
    var ripple = hypermedia(data(core()))
      , count = 0

    ripple('github', 'https://api.github.com', { http: http })
    
    ripple('github.current_user_url').on('change.first', function(user){ 
      if (!user.login) return
      ripple('github.current_user_url').on('change.second', Function('throw Error')) 
      time(1000, done)
    })
  })

  it('should fail if cannot fetch resource - general', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.github.com')
    ripple('github.current_user_url').on('change', function(body){
      expect(body).to.be.eql({})
    })

    time(2000, function(){
      expect('github' in ripple.resources).to.be.ok
      expect('github.current_user_url' in ripple.resources).to.be.ok
      expect(ripple('github.current_user_url')).to.be.eql({})
      done()
    })
  })


  it('should fail if cannot fetch resource - auth', function(done){  
    var ripple = hypermedia(data(core()))
    ripple('github', 'https://api.api.api.api.com').on('change', Function('throw Error'))

    time(2000, function(){
      expect('github' in ripple.resources).to.be.ok
      expect(ripple('github')).to.be.eql({})
      done()
    })
  })

})


function auth(){
  return { Authorization: 'Basic ' + new Buffer(process.env.GITHUB_USERNAME + ":" + process.env.GITHUB_PASSWORD).toString('base64') }
}