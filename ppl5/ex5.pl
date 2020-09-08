:- module('ex5',
        [activity/2,
         parents/3,
         participate/2,
         parent_details/3,
         not_member/2
        ]).

/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).
   
% Signature: activity(Name,Day)/2
% Purpose: describe an activity at the country club and the day it takes place
%
activity(swimming,sunday).
activity(ballet,monday).
activity(judu,tuesday).
activity(soccer,wednesday).
activity(art,sunday).
activity(yoga,tuesday).

% Signature: parents(Child,Parent1,Parent2)/3
% Purpose: parents - child relation
%
parents(dany,hagit,yossi).
parents(dana,hagit,yossi).
parents(guy,meir,dikla).
parents(shai,dor,meni).

% Signature: participate(Child_name,Activity)/2
% Purpose: registration details
%
participate(dany,swimming).
participate(dany,ballet).
participate(dana,soccer).
participate(dana,judu).
participate(guy,judu).
participate(shai,soccer).

% Signature: parent_details(Name,Phone,Has_car)/3
% Purpose: parents details
%
parent_details(hagit,"0545661332",true).
parent_details(yossi,"0545661432",true).
parent_details(meir,"0545661442",false).
parent_details(dikla,"0545441332",true).
parent_details(dor,"0545881332",false).
parent_details(meni,"0545677332",true).

% Signature: not_member(Element, List)/2
% Purpose: The relation in which Element is not a member of a List.
%
not_member(_, []).
not_member(X, [Y|Ys]) :- X \= Y,
                         not_member(X, Ys).


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% To Do


% Signature: pick_me_up(Child_name,Phone)/2
% Purpose: The relation between a child name and its parent phone number, when the parent has a car.
pick_me_up(C, N) :- parents(C, P, _), parent_details(P, N, true).
pick_me_up(C, N) :- parents(C, _, P), parent_details(P, N, true).

% Signature: active_child(Name)/1
% Purpose: child with Name is enrolled in at least 2 activities.
active_child(C) :- participate(C, A), participate(C, B), A\=B.


% Signature: activity_participants_list(Name, List)/2
% Purpose: every element in List is a child enrolled in activity Name.
activity_participants_list(A, L) :- findall(C, participate(C, A), L).

% Signature: can_register(Child_name,Activity)/2
% Purpose: Child with Child_name is not enrolled in any activity that occurs on the same day as Activity.
can_register(C, A) :- findall(Z, (participate(C,X), activity(X,Z)), TAKEN), activity(A, D), not_member(D,TAKEN).



