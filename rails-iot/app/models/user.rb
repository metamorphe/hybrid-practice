class User < ActiveRecord::Base
  @whitelist = ["cearto@berkeley.edu", "algarcia@berkeley.edu", "advaita@berkeley.edu", "paulos@berkeley.edu"]

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :swatches, foreign_key:"author_id"
  devise :omniauthable, omniauth_providers: [:google_oauth2]
  def self.find_for_google_oauth2(access_token, signed_in_resource=nil)
      data = access_token.info
      
      if not @whitelist.include?(access_token.info.email)
        return nil
      end
      
      user = User.where(:email => access_token.info.email).first
      
      if user
        return user
      else
          user = User.create(
            name: data["name"],
            provider:access_token.provider,
            email: data["email"],
            uid: access_token.uid ,
            password: Devise.friendly_token[0,20],
          )
          return user
      end
  end
    
  def self.from_omniauth(access_token)
    data = access_token.info
    user = User.where(email: data['email']).first

    # Uncomment the section below if you want users to be created if they don't exist
    unless user
        user = User.create(name: data['name'],
            email: data['email'],
            password: Devise.friendly_token[0,20]
        )
    end
    user
  end
end
