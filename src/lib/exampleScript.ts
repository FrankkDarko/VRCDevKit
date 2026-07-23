/** Sample UdonSharp script used by the "load example" button and ?demo=1. */
export const EXAMPLE_FILE_NAME = 'SyncedDoor.cs';

export const EXAMPLE_SOURCE = `using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

[UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]
public class SyncedDoor : UdonSharpBehaviour
{
    [Header("References")]
    [Tooltip("The door hinge that gets rotated when opening.")]
    public Transform hinge;

    [SerializeField, Tooltip("Sound played when the door opens.")]
    private AudioSource openSound;

    [Header("Tuning")]
    [Range(10f, 180f)]
    [Tooltip("Opening angle, in degrees.")]
    public float openAngle = 110f;

    [Range(0.2f, 5f)]
    [Tooltip("Time to fully open, in seconds.")]
    public float openDuration = 0.8f;

    [Tooltip("Players allowed to lock the door (display names). Leave empty to allow everyone.")]
    public string[] lockWhitelist = new string[0];

    [Header("Network state")]
    [UdonSynced, HideInInspector]
    public bool isOpen;

    [UdonSynced(UdonSyncMode.None)]
    [Tooltip("Display name of the last player who used the door.")]
    public string lastUser = "";

    private float animationProgress;

    public override void Interact()
    {
        Networking.SetOwner(Networking.LocalPlayer, gameObject);
        isOpen = !isOpen;
        lastUser = Networking.LocalPlayer.displayName;
        RequestSerialization();
        ApplyState();
    }

    public override void OnDeserialization()
    {
        ApplyState();
    }

    private void ApplyState()
    {
        // Rotation/animation elided for the example.
        if (isOpen && openSound != null) openSound.Play();
    }
}
`;
