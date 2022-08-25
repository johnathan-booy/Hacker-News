"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */
class Story {
	/** Make instance of Story from data object about story:
	 *   - {title, author, url, username, storyId, createdAt}
	 */
	constructor({ storyId, title, author, url, username, createdAt }) {
		this.storyId = storyId;
		this.title = title;
		this.author = author;
		this.url = url;
		this.username = username;
		this.createdAt = createdAt;
	}

	/** Parses hostname out of URL and returns it. */
	getHostName() {
		const domain = new URL(this.url);
		return domain.hostname;
	}
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */
class StoryList {
	constructor(stories) {
		this.stories = stories;
	}

	/** Generate a new StoryList. It:
	 *
	 *  - calls the API
	 *  - builds an array of Story instances
	 *  - makes a single StoryList instance out of that
	 *  - returns the StoryList instance.
	 */
	static async getStories() {
		// query the /stories endpoint (no auth required)
		const response = await axios({
			url: `${BASE_URL}/stories`,
			method: "GET",
		});

		// turn plain old story objects from API into instances of Story class
		const stories = response.data.stories.map((story) => new Story(story));

		// build an instance of our own class using the new array of stories
		return new StoryList(stories);
	}

	async getMoreStories() {
		console.debug("getMoreStories");
		const response = await axios({
			url: `${BASE_URL}/stories?skip=${this.stories.length}`,
			method: "GET",
		});
		const newStories = response.data.stories.map((story) => new Story(story));
		this.stories = this.stories.concat(newStories);
	}

	/** Adds story data to API, makes a Story instance, adds it to story list.
	 * - user - the current instance of User who will post the story
	 * - obj of {title, author, url}
	 *
	 * Returns the new Story instance
	 */
	static async addStory(user, newStory) {
		const response = await axios({
			method: "post",
			url: `${BASE_URL}/stories`,
			data: {
				token: user.loginToken,
				story: newStory,
			},
		});

		return new Story(response.data.story);
	}

	async deleteStory(storyId) {
		const response = await axios({
			url: `${BASE_URL}/stories/${storyId}`,
			method: "DELETE",
			data: { token: currentUser.loginToken },
		});

		$(`#${storyId}`).remove();

		this.stories = this.stories.filter((story) => {
			return story.storyId !== storyId;
		});
	}

	getStoryfromId(storyId) {
		for (let story of this.stories) {
			if (story.storyId === storyId) return story;
		}
	}
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */
class User {
	/** Make user instance from obj of user data and a token:
	 *   - {username, name, createdAt, favorites[], ownStories[]}
	 *   - token
	 */
	constructor(
		{ username, name, createdAt, favorites = [], ownStories = [] },
		token
	) {
		this.username = username;
		this.name = name;
		this.createdAt = createdAt;

		// instantiate Story instances for the user's favorites and ownStories
		this.favorites = favorites.map((s) => new Story(s));
		this.ownStories = ownStories.map((s) => new Story(s));

		// store the login token on the user so it's easy to find for API calls.
		this.loginToken = token;
	}

	/** Register new user in API, make User instance & return it.
	 *
	 * - username: a new username
	 * - password: a new password
	 * - name: the user's full name
	 */
	static async signup(username, password, name) {
		const response = await axios({
			url: `${BASE_URL}/signup`,
			method: "POST",
			data: { user: { username, password, name } },
		});

		let { user } = response.data;

		return new User(
			{
				username: user.username,
				name: user.name,
				createdAt: user.createdAt,
				favorites: user.favorites,
				ownStories: user.stories,
			},
			response.data.token
		);
	}

	/** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */
	static async login(username, password) {
		const response = await axios({
			url: `${BASE_URL}/login`,
			method: "POST",
			data: { user: { username, password } },
		});

		let { user } = response.data;

		return new User(
			{
				username: user.username,
				name: user.name,
				createdAt: user.createdAt,
				favorites: user.favorites,
				ownStories: user.stories,
			},
			response.data.token
		);
	}

	/** When we already have credentials (token & username) for a user,
	 *   we can log them in automatically. This function does that.
	 */
	static async loginViaStoredCredentials(token, username) {
		try {
			const response = await axios({
				url: `${BASE_URL}/users/${username}`,
				method: "GET",
				params: { token },
			});

			let { user } = response.data;

			return new User(
				{
					username: user.username,
					name: user.name,
					createdAt: user.createdAt,
					favorites: user.favorites,
					ownStories: user.stories,
				},
				token
			);
		} catch (err) {
			console.error("loginViaStoredCredentials failed", err);
			return null;
		}
	}

	async updateName(name) {
		console.debug("updateName");
		const response = await axios({
			url: `${BASE_URL}/users/${this.username}`,
			method: "PATCH",
			data: { token: this.loginToken, user: { name } },
		});
		if (response.statusText === "OK") this.name = name;
		return response.statusText;
	}

	async updatePassword(password) {
		console.debug("updatePassword");
		const response = await axios({
			url: `${BASE_URL}/users/${this.username}`,
			method: "PATCH",
			data: { token: this.loginToken, user: { password } },
		});
		return response.statusText;
	}

	async updateProfile({ name, password }) {
		let nameStatus;
		let passwordStatus;

		if (name.length) {
			nameStatus = await this.updateName(name);
		}
		if (password.length) {
			passwordStatus = await this.updatePassword(password);
		}

		if (nameStatus === "OK" && passwordStatus === "OK") {
			alert("Name and Password Changed!");
		} else if (nameStatus === "OK") {
			alert("Name Changed!");
		} else if (passwordStatus === "OK") {
			alert("Password Changed!");
		} else {
			alert("Failed to Update Profile!");
		}
	}

	async addFavorite(storyId) {
		console.debug("addFavorite");
		const response = await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
			method: "POST",
			params: { token: this.loginToken },
		});

		if (response.statusText === "OK")
			this.favorites.push(storyList.getStoryfromId(storyId));
	}

	async deleteFavorite(storyId) {
		console.debug("deleteFavorite");
		const response = await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
			method: "DELETE",
			params: { token: this.loginToken },
		});

		if (response.statusText === "OK") {
			this.favorites = this.favorites.filter((story) => {
				return story.storyId !== storyId;
			});
		}
	}
}
