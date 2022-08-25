"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

function generateStoryMarkup(story) {
	// console.debug("generateStoryMarkup", story);
	const hostName = story.getHostName();
	const favoriteIconClass = checkFavoriteStatus(story.storyId) ? "fas" : "far";

	return $(`
      <li id="${story.storyId}">
	  	<span class="story-favorite hidden">
			<i class="fa-star ${favoriteIconClass}"></i>
		</span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function putStoriesOnPage() {
	console.debug("putStoriesOnPage");

	$allStoriesList.empty();

	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}
	hideOrShowFavoriteIcons();
	$allStoriesList.show();
}

function putMoreStoriesOnPage(newStoryIdx) {
	console.debug("putMoreStoriesOnPage");

	storyList.stories.forEach((story, index) => {
		if (index >= newStoryIdx) {
			const $story = generateStoryMarkup(story);
			$allStoriesList.append($story);
		}
	});
	hideOrShowFavoriteIcons();
}

function putFavoriteStoriesOnPage() {
	console.debug("putFavoriteStoriesOnPage");

	$allStoriesList.empty();

	if (currentUser.favorites.length) {
		for (let story of currentUser.favorites) {
			const $story = generateStoryMarkup(story);
			$allStoriesList.append($story);
		}
		hideOrShowFavoriteIcons();
	} else {
		$("<h5>No favorites added!</h5>").appendTo($allStoriesList);
	}

	$allStoriesList.show();
}

function putMyStoriesOnPage() {
	console.debug("putMyStoriesOnPage");

	$allStoriesList.empty();

	if (currentUser.favorites.length) {
		for (let story of currentUser.ownStories) {
			const $story = generateStoryMarkup(story);
			$allStoriesList.append($story);
		}
		hideOrShowFavoriteIcons();
	} else {
		$("<h5>No stories added by user yet!</h5>").appendTo($allStoriesList);
	}

	$allStoriesList.show();
}

async function createNewStory(evt) {
	console.debug("createNewStory");

	evt.preventDefault();

	const newStory = await StoryList.addStory(currentUser, getSubmitFormData());

	currentUser.ownStories.unshift(newStory);
	storyList.stories.unshift(newStory);

	putStoriesOnPage();
	clearSubmitForm();
}
$submitForm.on("submit", createNewStory);

function clearSubmitForm() {
	$("#submit-author").val("");
	$("#submit-title").val("");
	$("#submit-url").val("");
	$submitForm.hide();
}

function getSubmitFormData() {
	const author = $("#submit-author").val();
	const title = $("#submit-title").val();
	const url = $("#submit-url").val();
	return { author, title, url };
}

async function toggleFavoriteStory(evt) {
	console.debug("toggleFavoriteStory");

	const storyId = $(this).parent().attr("id");
	const isFavorite = checkFavoriteStatus(storyId);
	const $span = $(this);

	if (isFavorite) {
		currentUser.deleteFavorite(storyId);
	} else {
		currentUser.addFavorite(storyId);
	}

	replaceFavoriteIcon($span, isFavorite);
}
$allStoriesList.on("click", ".story-favorite", toggleFavoriteStory);

function checkFavoriteStatus(storyId) {
	if (currentUser instanceof User) {
		let isFavorite = false;
		for (let favorite of currentUser.favorites) {
			if (favorite.storyId === storyId) {
				isFavorite = true;
				break;
			}
		}
		return isFavorite;
	}
	return false;
}

function replaceFavoriteIcon($span, isFavorite) {
	const $icon = $span.children("i");
	isFavorite
		? $icon.removeClass("fas").addClass("far")
		: $icon.removeClass("far").addClass("fas");
}

function hideOrShowFavoriteIcons() {
	if (currentUser instanceof User) {
		$(".story-favorite").show();
	} else {
		$(".story-favorite").hide();
	}
}

function createDeleteButtons() {
	const $allLis = $allStoriesList.children("li");
	for (let li of $allLis) {
		const $li = $(li);
		const $span = $("<span>").addClass("story-delete");
		const $icon = $("<i>").addClass("fas fa-trash-alt");

		$icon.appendTo($span);
		$span.prependTo($li);
	}
}
async function deleteButtonClick(evt) {
	const storyId = $(this).parent().attr("id");
	await storyList.deleteStory(storyId);
	removeStoryFromFavorites(storyId);
	removeStoryFromOwnStories(storyId);
}
$allStoriesList.on("click", ".story-delete", deleteButtonClick);

function removeStoryFromFavorites(storyId) {
	currentUser.favorites = currentUser.favorites.filter((story) => {
		return story.storyId !== storyId;
	});
}

function removeStoryFromOwnStories(storyId) {
	currentUser.ownStories = currentUser.ownStories.filter((story) => {
		return story.storyId !== storyId;
	});
}

$(window).scroll(async function () {
	// Scrolled to the bottom?
	if ($(document).height() - $(this).height() - $(this).scrollTop() < 1) {
		console.debug("Scrolled to the bottom");
		const newStoryIdx = storyList.stories.length;
		await storyList.getMoreStories();
		putMoreStoriesOnPage(newStoryIdx);
	}
});
