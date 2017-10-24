class OmniauthCallbacksController < Devise::OmniauthCallbacksController   
  def google_oauth2
    @user = User.find_for_google_oauth2(request.env["omniauth.auth"], current_user)
    if @user.nil?
      redirect_to root_path, alert: "Email Cesar at cearto@berkeley.edu with your Berkeley email to request Project admin priveleges."
      return
    end
    if @user.persisted?
      flash[:notice] = I18n.t "devise.omniauth_callbacks.success", :kind => "Google"
      sign_in_and_redirect @user, :event => :authentication
    else
      session["devise.google_data"] = request.env["omniauth.auth"].select { |k, v| k == "email" }
      redirect_to new_user_registration_url
    end
  end
end