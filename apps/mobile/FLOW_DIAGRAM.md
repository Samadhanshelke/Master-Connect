# Master Connect - App Flow Diagram

This diagram outlines the user flow for the **Master Connect** application, covering both implemented features and planned modules based on the project documentation.

```mermaid
graph TD
    %% Nodes
    Start((App Launch))
    Splash[Splash Screen]
    Welcome[Welcome / Onboarding]
    
    subgraph Auth_Flow [Authentication & Setup]
        Login{User Logged In?}
        AuthScreen[Login / Sign Up]
        SelectMaster[Select Master Community]
    end

    subgraph Main_App [Main Tab Navigator]
        HomeTab[Home / Feed]
        ChatTab[Chat / Community]
        ShopTab[Shop / Marketplace]
        ProfileTab[Profile / Settings]
    end

    subgraph Home_Features [Home Features]
        ViewFeed[View Posts]
        CreatePost[Create Post]
        Interact[Like / Comment]
    end

    subgraph Chat_Features [Chat Features]
        GlobalChat[General Discussion]
        SubGroups[Interest Sub-groups]
        DM[Direct Messages]
    end

    subgraph Shop_Features [Shop Features]
        BrowseShops[Browse Local Vendors]
        ProductDetails[View Product Details]
        ContactVendor[Contact Vendor]
    end

    %% Connections
    Start --> Splash
    Splash --> Login
    
    Login -- No --> Welcome
    Welcome --> AuthScreen
    AuthScreen --> SelectMaster
    SelectMaster --> HomeTab
    
    Login -- Yes --> HomeTab

    %% Tab Navigation
    HomeTab <--> ChatTab
    ChatTab <--> ShopTab
    ShopTab <--> ProfileTab
    ProfileTab <--> HomeTab

    %% Feature Drill-downs
    HomeTab --> ViewFeed
    ViewFeed --> CreatePost
    ViewFeed --> Interact

    ChatTab --> GlobalChat
    ChatTab --> SubGroups
    ChatTab --> DM

    ShopTab --> BrowseShops
    BrowseShops --> ProductDetails
    ProductDetails --> ContactVendor

    %% Styling
    classDef primary fill:#e0f2f1,stroke:#009688,stroke-width:2px;
    classDef secondary fill:#fff8e1,stroke:#ffc107,stroke-width:2px;
    classDef neutral fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px;

    class Splash,Welcome,HomeTab,ChatTab,ShopTab,ProfileTab primary;
    class AuthScreen,SelectMaster secondary;
    class ViewFeed,CreatePost,Interact,GlobalChat,SubGroups,DM,BrowseShops,ProductDetails,ContactVendor neutral;
```

## Flow Description

1.  **Onboarding**: New users are greeted with a value proposition (Community, Chat, Shop) before proceeding to setup.
2.  **Setup**: Users identify their "Master Community" (Location/Group) to ensure content relevance.
3.  **Home (Feed)**: The central hub for community updates, news, and social interaction.
4.  **Chat**: Real-time communication channels for the community and specific interest groups.
5.  **Shop**: A marketplace for local vendors to list products and for users to discover local businesses.
