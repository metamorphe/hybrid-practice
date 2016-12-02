# Hybrid Practice

## Prerequisites
1. Install rails and configure github 4.2.6 by following [these instructions.](https://gorails.com/setup/osx/10.11-el-capitan)
2. Clone this repo into <top directory> somewhere on your machine.
3. CD into <top directory>/rails-iot
4. Run ```bundle install``` (see Troubleshooting section if you get error messages)
3. Handle the migration
  ```
  bin/rake db:migrate RAILS_ENV=development
  ```
  
## Control server
1. Navigate to rails-iot/
2. To start the server, run
  ```
  rails server
  ```
3. To stop the server, type ```ctrl-c``` in the window where you started the server.

## Navigate to "Light as Material" light design tool
1. Open a browser, and navigate to
```
http://localhost:3000/tool/designer
```

#Troubleshooting
1. Error message:

  ```
  An error occurred while installing eventmachine (1.0.5), and Bundler cannot continue.
  Make sure that `gem install eventmachine -v '1.0.5'` succeeds before bundling.
  ```

  Open the Gemfile.lock file:
  ```
  vim Gemfile.lock
  ```
  And change 
  ```
  eventmachine (1.0.5)
  ```
  to
  ```
  eventmachine (1.0.9)
  ```
  Now run 
  ```
  bundle install
  ```
  again.

2. Error message:
  ```
  ./project.h:116:10: fatal error: 'openssl/ssl.h' file not found
  #include <openssl/ssl.h>
  ```
  The [suggested fix](https://github.com/eventmachine/eventmachine/issues/643) is to use the openssl headers (they are no longer included by default on El Capitan):
  ```
  brew link openssl --force
  ```
  But linking keg-only openssl means you may end up linking against the insecure, deprecated system OpenSSL while using the headers from Homebrew's openssl. Instead, install eventmachine 1.0.9 instead (see error #1 for instructions).
  
