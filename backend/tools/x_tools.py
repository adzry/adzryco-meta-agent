"""
AdzryCo Meta-Agent — X/Twitter Tools (Tweepy OAuth2)
12 tools: all original + follow, unfollow, get_analytics, generate_thread
"""
import tweepy
from loguru import logger
from typing import Optional
from config import settings


def get_tweepy_client() -> tweepy.Client:
    return tweepy.Client(
        bearer_token=settings.x_bearer_token,
        consumer_key=settings.x_api_key,
        consumer_secret=settings.x_api_secret,
        access_token=settings.x_access_token,
        access_token_secret=settings.x_access_token_secret,
        wait_on_rate_limit=True,
    )


def get_tweepy_api() -> tweepy.API:
    auth = tweepy.OAuth1UserHandler(
        settings.x_api_key,
        settings.x_api_secret,
        settings.x_access_token,
        settings.x_access_token_secret,
    )
    return tweepy.API(auth, wait_on_rate_limit=True)


def create_tweet(text: str, reply_to_id: Optional[str] = None) -> dict:
    """Post a tweet, optionally as a reply."""
    try:
        client = get_tweepy_client()
        kwargs = {"text": text}
        if reply_to_id:
            kwargs["in_reply_to_tweet_id"] = reply_to_id
        response = client.create_tweet(**kwargs)
        tweet_id = response.data["id"]
        logger.info(f"Tweet created: {tweet_id}")
        return {"success": True, "tweet_id": tweet_id, "text": text}
    except Exception as e:
        logger.error(f"create_tweet failed: {e}")
        return {"success": False, "error": str(e)}


def delete_tweet(tweet_id: str) -> dict:
    """Delete a tweet by ID."""
    try:
        client = get_tweepy_client()
        client.delete_tweet(id=tweet_id)
        return {"success": True, "tweet_id": tweet_id}
    except Exception as e:
        logger.error(f"delete_tweet failed: {e}")
        return {"success": False, "error": str(e)}


def like_tweet(tweet_id: str) -> dict:
    """Like a tweet."""
    try:
        client = get_tweepy_client()
        me = client.get_me()
        client.like(tweet_id=tweet_id, user_auth=True)
        return {"success": True, "tweet_id": tweet_id}
    except Exception as e:
        logger.error(f"like_tweet failed: {e}")
        return {"success": False, "error": str(e)}


def retweet_tweet(tweet_id: str) -> dict:
    """Retweet a tweet."""
    try:
        client = get_tweepy_client()
        me = client.get_me()
        client.retweet(tweet_id=tweet_id, user_auth=True)
        return {"success": True, "tweet_id": tweet_id}
    except Exception as e:
        logger.error(f"retweet_tweet failed: {e}")
        return {"success": False, "error": str(e)}


def search_tweets(query: str, max_results: int = 10) -> dict:
    """Search recent tweets."""
    try:
        client = get_tweepy_client()
        results = client.search_recent_tweets(
            query=query,
            max_results=min(max_results, 100),
            tweet_fields=["created_at", "author_id", "public_metrics"],
        )
        tweets = []
        if results.data:
            for t in results.data:
                tweets.append({
                    "id": t.id,
                    "text": t.text,
                    "created_at": str(t.created_at) if t.created_at else None,
                    "metrics": t.public_metrics,
                })
        return {"success": True, "tweets": tweets, "count": len(tweets)}
    except Exception as e:
        logger.error(f"search_tweets failed: {e}")
        return {"success": False, "error": str(e)}


def get_user(username: str) -> dict:
    """Get user profile info."""
    try:
        client = get_tweepy_client()
        user = client.get_user(
            username=username,
            user_fields=["public_metrics", "description", "created_at", "profile_image_url"],
        )
        if user.data:
            u = user.data
            return {
                "success": True,
                "user": {
                    "id": u.id,
                    "name": u.name,
                    "username": u.username,
                    "description": u.description,
                    "metrics": u.public_metrics,
                    "created_at": str(u.created_at) if u.created_at else None,
                    "profile_image_url": u.profile_image_url,
                },
            }
        return {"success": False, "error": "User not found"}
    except Exception as e:
        logger.error(f"get_user failed: {e}")
        return {"success": False, "error": str(e)}


def create_direct_message(username: str, text: str) -> dict:
    """Send a DM to a user."""
    try:
        client = get_tweepy_client()
        user = client.get_user(username=username)
        if not user.data:
            return {"success": False, "error": "User not found"}
        client.create_direct_message(participant_id=user.data.id, text=text)
        return {"success": True, "recipient": username, "text": text}
    except Exception as e:
        logger.error(f"create_direct_message failed: {e}")
        return {"success": False, "error": str(e)}


def add_member_to_list(list_id: str, username: str) -> dict:
    """Add a user to a Twitter list."""
    try:
        client = get_tweepy_client()
        user = client.get_user(username=username)
        if not user.data:
            return {"success": False, "error": "User not found"}
        client.add_list_member(id=list_id, user_id=user.data.id, user_auth=True)
        return {"success": True, "list_id": list_id, "username": username}
    except Exception as e:
        logger.error(f"add_member_to_list failed: {e}")
        return {"success": False, "error": str(e)}


def follow_user(username: str) -> dict:
    """Follow a user."""
    try:
        client = get_tweepy_client()
        me = client.get_me()
        user = client.get_user(username=username)
        if not user.data:
            return {"success": False, "error": "User not found"}
        client.follow_user(target_user_id=user.data.id, user_auth=True)
        return {"success": True, "following": username}
    except Exception as e:
        logger.error(f"follow_user failed: {e}")
        return {"success": False, "error": str(e)}


def unfollow_user(username: str) -> dict:
    """Unfollow a user."""
    try:
        client = get_tweepy_client()
        me = client.get_me()
        user = client.get_user(username=username)
        if not user.data:
            return {"success": False, "error": "User not found"}
        client.unfollow_user(target_user_id=user.data.id, user_auth=True)
        return {"success": True, "unfollowed": username}
    except Exception as e:
        logger.error(f"unfollow_user failed: {e}")
        return {"success": False, "error": str(e)}


def get_analytics(tweet_id: Optional[str] = None) -> dict:
    """Get analytics for a tweet or recent tweets."""
    try:
        client = get_tweepy_client()
        if tweet_id:
            tweet = client.get_tweet(
                id=tweet_id,
                tweet_fields=["public_metrics", "created_at", "text"],
            )
            if tweet.data:
                return {"success": True, "analytics": {
                    "tweet_id": tweet_id,
                    "text": tweet.data.text,
                    "metrics": tweet.data.public_metrics,
                    "created_at": str(tweet.data.created_at),
                }}
        me = client.get_me()
        user = client.get_user(
            id=me.data.id,
            user_fields=["public_metrics"],
        )
        return {
            "success": True,
            "analytics": {
                "account": me.data.username,
                "metrics": user.data.public_metrics,
            },
        }
    except Exception as e:
        logger.error(f"get_analytics failed: {e}")
        return {"success": False, "error": str(e)}


def post_thread(tweets: list[str]) -> dict:
    """Post a thread of tweets sequentially with 3s delay."""
    import time
    client = get_tweepy_client()
    posted = []
    reply_to = None
    try:
        for i, text in enumerate(tweets):
            kwargs = {"text": text}
            if reply_to:
                kwargs["in_reply_to_tweet_id"] = reply_to
            response = client.create_tweet(**kwargs)
            tweet_id = response.data["id"]
            posted.append({"index": i, "tweet_id": tweet_id, "text": text})
            reply_to = tweet_id
            if i < len(tweets) - 1:
                time.sleep(3)
        return {"success": True, "thread": posted, "count": len(posted)}
    except Exception as e:
        logger.error(f"post_thread failed at tweet {len(posted)}: {e}")
        return {"success": False, "error": str(e), "posted_so_far": posted}
