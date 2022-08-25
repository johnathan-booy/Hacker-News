"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */
function navAllStories(evt) {
	console.debug("navAllStories", evt);
	hidePageComponents();
	putStoriesOnPage();
}
$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */
function navLoginClick(evt) {
	console.debug("navLoginClick", evt);
	hidePageComponents();
	$loginForm.show();
	$signupForm.show();
}
$navLogin.on("click", navLoginClick);

/** Show update on click on user profile */
function navUserProfileClick(evt) {
	console.debug("navUserProfileClick", evt);
	hidePageComponents();
	populateUserProfile();
	$userProfile.show();
	$updateForm.show();
}
$navUserProfile.on("click", navUserProfileClick);

/* Show new story submit form on click on submit */
function navSubmitClick(evt) {
	console.debug("navSubmitClick", evt);
	hidePageComponents();
	putStoriesOnPage();
	$submitForm.show();
}
$navSubmit.on("click", navSubmitClick);

/* Show only favorite stories on click */
function navFavoritesClick(evt) {
	console.debug("navSubmitClick", evt);
	hidePageComponents();
	putFavoriteStoriesOnPage();
}
$navFavorites.on("click", navFavoritesClick);

/* Show only users own stories on click */
function navMyStoriesClick(evt) {
	console.debug("navSubmitClick", evt);
	hidePageComponents();
	putMyStoriesOnPage();
	createDeleteButtons();
}
$navMyStories.on("click", navMyStoriesClick);

/** When a user first logins in, update the navbar to reflect that. */
function updateNavOnLogin() {
	console.debug("updateNavOnLogin");
	$(".main-nav-links").show();
	$navLogin.hide();
	$navLogOut.show();
	$navUser.show();
	$navUserProfile.text(`${currentUser.username}`).show();
}
