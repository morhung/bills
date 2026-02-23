const chatOpsHost = "https://chat.runsystem.vn/api/v4";
const coCsrfToken = "edj91ri7xpf3pksxte3uxr5toe"; // sender
const coMmAuthToken = "utydwiwf5fyo58fauzqjpp5jww"; // sender

export interface ChatOpsUser {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    nickname: string;
    position: string;
    avatar_url?: string;
}

export interface ChatOpsChannel {
    id: string;
    name: string;
}

const getHeaders = (authToken = coMmAuthToken, csrfToken = coCsrfToken) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (authToken) {
        headers["cookie"] = `MMAUTHTOKEN=${authToken}`;
    }

    if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
    }

    return headers;
};

export const chatopsService = {
    /**
     * Search for users by name
     */
    async findUser(name: string): Promise<ChatOpsUser[]> {
        if (!name || name.length < 2) return [];

        try {
            const url = `${chatOpsHost}/users/autocomplete?in_team=orgx3i1z9fg1pn9y4fe3zctwuo&in_channel=&limit=25&name=${encodeURIComponent(name)}`;
            const headers = getHeaders();
            console.log('Fetching ChatOps (Fetch):', url, { headers });

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`ChatOps API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('Error finding user in ChatOps:', error);
            return [];
        }
    },

    /**
     * Find Tag ID for a specific user ID
     */
    async findTagId(userId: string): Promise<string | null> {
        try {
            const url = `${chatOpsHost}/users/me/teams/orgx3i1z9fg1pn9y4fe3zctwuo/channels?include_deleted=true`;
            const headers = getHeaders();

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`ChatOps API error: ${response.statusText}`);
            }

            const data = await response.json();
            // User logic: const data = rs.data.filter(obj => obj.name.includes(id));
            const filteredChannel = data.find((channel: ChatOpsChannel) => channel.name.includes(userId));
            return filteredChannel?.id || null;
        } catch (error) {
            console.error('Error finding Tag ID in ChatOps:', error);
            return null;
        }
    }
};
