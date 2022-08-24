"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

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

function updateStoriesOnLogin() {
	$(".story-favorite").show();
}

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

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

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug("putStoriesOnPage");

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

async function createNewStory(evt) {
	evt.preventDefault();
	console.debug("createNewStory");

	const author = $("#submit-author").val();
	const title = $("#submit-title").val();
	const url = $("#submit-url").val();
	const newStory = await StoryList.addStory(currentUser, {
		author,
		title,
		url,
	});

	storyList.stories.unshift(newStory);
	putStoriesOnPage();
}

$submitForm.on("submit", createNewStory);

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
